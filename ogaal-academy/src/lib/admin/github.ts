import "server-only";

/**
 * Talks to the private storage repository through the GitHub REST API. Server-side only: the token never
 * reaches the browser. Only encrypted bytes and generic commit messages are sent.
 */
export class StorageError extends Error {}
/** The file changed on GitHub since it was read. The caller re-reads and tries again. */
export class ConflictError extends Error {}

const repo = () => process.env.GITHUB_STORAGE_REPO ?? "";
const branch = () => process.env.GITHUB_STORAGE_BRANCH || "main";
const baseUrl = () => (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");

export const isStorageConfigured = () => /^[\w.-]+\/[\w.-]+$/.test(repo()) && Boolean(process.env.GITHUB_STORAGE_TOKEN) && Buffer.from(process.env.DATA_ENCRYPTION_KEY ?? "", "base64").length === 32;

async function request(path: string, init: RequestInit = {}, headers: Record<string, string> = {}): Promise<Response> {
  try {
    return await fetch(`${baseUrl()}/repos/${repo()}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_STORAGE_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ogaal-academy-admin",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
    });
  } catch (err) {
    throw new StorageError(`Could not reach GitHub: ${(err as Error).message}`);
  }
}

const failure = (action: string, res: Response) => new StorageError(`GitHub ${action} failed with status ${res.status}.`);
const contentsPath = (path: string) => `/contents/${path.split("/").map(encodeURIComponent).join("/")}`;

let privateCheckedAt = 0;

/** Refuses to touch the repository unless GitHub reports it as private. */
export async function assertPrivateRepository(): Promise<void> {
  if (Date.now() - privateCheckedAt < 10 * 60 * 1000) return;
  const res = await request("");
  if (!res.ok) throw failure("repository check", res);
  const body = (await res.json()) as { private?: boolean };
  if (body.private !== true) throw new StorageError("The storage repository is not private. Refusing to read or write employee data.");
  privateCheckedAt = Date.now();
}

export type FileResult = { status: "missing" } | { status: "unchanged" } | { status: "ok"; sha: string; etag: string | null; data: Buffer };

/** A matching ETag gets a 304, which does not count against the GitHub rate limit. */
export async function getFile(path: string, etag?: string | null): Promise<FileResult> {
  await assertPrivateRepository();
  const res = await request(`${contentsPath(path)}?ref=${encodeURIComponent(branch())}`, {}, etag ? { "If-None-Match": etag } : {});
  if (res.status === 304) return { status: "unchanged" };
  if (res.status === 404) return { status: "missing" };
  if (!res.ok) throw failure("read", res);
  const body = (await res.json()) as { sha: string; content?: string; encoding?: string };
  let content = body.content ?? "";
  // Files over 1 MB come back without content, so they are fetched by SHA. That cannot race with a newer write.
  if (body.encoding !== "base64") {
    const blob = await request(`/git/blobs/${body.sha}`);
    if (!blob.ok) throw failure("large file read", blob);
    content = ((await blob.json()) as { content: string }).content;
  }
  return { status: "ok", sha: body.sha, etag: res.headers.get("etag"), data: Buffer.from(content, "base64") };
}

/** Writes only if `sha` is still the file's current version. Omit it to create a new file. */
export async function putFile(path: string, data: Buffer, message: string, sha?: string): Promise<string> {
  await assertPrivateRepository();
  const res = await request(contentsPath(path), {
    method: "PUT",
    body: JSON.stringify({ message, content: data.toString("base64"), branch: branch(), ...(sha ? { sha } : {}) }),
  });
  // 409: the SHA is stale. 422: the file already exists and no SHA was given.
  if (res.status === 409 || res.status === 422) throw new ConflictError(`Conflict writing ${path}`);
  if (!res.ok) throw failure("write", res);
  return ((await res.json()) as { content: { sha: string } }).content.sha;
}

export async function deleteFile(path: string, message: string): Promise<void> {
  const current = await getFile(path);
  if (current.status !== "ok") return;
  const res = await request(contentsPath(path), { method: "DELETE", body: JSON.stringify({ message, sha: current.sha, branch: branch() }) });
  if (res.status === 409) throw new ConflictError(`Conflict deleting ${path}`);
  if (!res.ok && res.status !== 404) throw failure("delete", res);
}

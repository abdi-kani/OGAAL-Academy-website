import "server-only";
import crypto from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { ApiError } from "./api";
import { ConflictError, getFile, putFile } from "./github";

/** File layout: magic, 12-byte IV, 16-byte GCM tag, ciphertext. */
const MAGIC = Buffer.from("OGAAL1");

function encryptionKey(): Buffer {
  const key = Buffer.from(process.env.DATA_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes in base64.");
  return key;
}

/** `kind` is authenticated, so a file of one kind cannot be swapped in for another. Backups share the kind of their source. */
export function encrypt(data: Buffer, kind: string): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv).setAAD(Buffer.from(kind));
  const body = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), body]);
}

export function decrypt(file: Buffer, kind: string): Buffer {
  if (!file.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Not an encrypted OGAAL file.");
  const at = MAGIC.length;
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), file.subarray(at, at + 12)).setAAD(Buffer.from(kind));
  decipher.setAuthTag(file.subarray(at + 12, at + 28));
  return Buffer.concat([decipher.update(file.subarray(at + 28)), decipher.final()]);
}

type Loaded<T> = { sha?: string; etag: string | null; value: T };
type Options<T> = { kind: string; empty: () => T; message: string; beforeWrite?: (current: Loaded<T>, draft: T) => Promise<void> };

// Kept across hot reloads and shared by the route handlers and pages in this server instance.
const shared = globalThis as unknown as { __ogaalFiles?: Map<string, { cache: Loaded<unknown> | null; queue: Promise<unknown> }> };
const files = (shared.__ogaalFiles ??= new Map());

const MAX_ATTEMPTS = 6;

/**
 * One encrypted JSON file in the repository. A write states the SHA it was based on. If anything else got
 * there first, GitHub rejects it and the change is re-applied to the newer data, so nothing is overwritten.
 */
export function encryptedJsonFile<T>(path: string, options: Options<T>) {
  const slot = files.get(path) ?? { cache: null, queue: Promise.resolve() };
  files.set(path, slot);

  async function load(): Promise<Loaded<T>> {
    const cached = slot.cache as Loaded<T> | null;
    const result = await getFile(path, cached?.etag);
    if (result.status === "unchanged" && cached) return cached;
    if (result.status !== "ok") return (slot.cache = { etag: null, value: options.empty() }) as Loaded<T>;
    const value = JSON.parse(gunzipSync(decrypt(result.data, options.kind)).toString()) as T;
    return (slot.cache = { sha: result.sha, etag: result.etag, value }) as Loaded<T>;
  }

  const seal = (value: T) => encrypt(gzipSync(JSON.stringify(value)), options.kind);

  return {
    read: async (): Promise<T> => (await load()).value,
    seal,
    update<R>(change: (draft: T) => R): Promise<R> {
      const run = async (): Promise<R> => {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const current = await load();
          const draft = structuredClone(current.value);
          const result = change(draft);
          await options.beforeWrite?.(current, draft);
          try {
            const sha = await putFile(path, seal(draft), options.message, current.sha);
            slot.cache = { sha, etag: null, value: draft };
            return result;
          } catch (err) {
            if (!(err instanceof ConflictError)) throw err;
            slot.cache = null;
            await new Promise((r) => setTimeout(r, 150 * 2 ** attempt * (0.5 + Math.random())));
          }
        }
        throw new ApiError(409, "Too many changes were being saved at once. Please try again.");
      };
      // One write at a time per file in this instance. Other instances are handled by the SHA check.
      const queued = slot.queue.then(run, run);
      slot.queue = queued.catch(() => {});
      return queued;
    },
  };
}

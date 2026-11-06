// A local stand-in for the parts of the GitHub REST API the admin system uses. For tests only.
// Follows GitHub's rules: 409 on a stale SHA, 422 when a file exists and no SHA was given, ETags with 304,
// and no inline content for files over 1 MB. Run directly with: node scripts/fake-github.cjs <port>
const crypto = require("crypto");
const http = require("http");

function createFakeGitHub({ token, latencyMs = 15 }) {
  const repos = new Map([
    ["acme/private-store", { private: true, files: new Map(), commits: [] }],
    ["acme/public-store", { private: false, files: new Map(), commits: [] }],
  ]);
  const stats = { conflicts: 0, notModified: 0, blobReads: 0, requests: 0 };
  const shaOf = (data) => crypto.createHash("sha1").update(data).digest("hex");

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => setTimeout(() => handle(req, res, Buffer.concat(chunks)), latencyMs));
  });

  function send(res, status, body, headers = {}) {
    res.writeHead(status, { "Content-Type": "application/json", ...headers });
    res.end(body === undefined ? undefined : JSON.stringify(body));
  }

  function handle(req, res, raw) {
    stats.requests++;
    if (req.headers.authorization !== `Bearer ${token}`) return send(res, 401, { message: "Bad credentials" });
    const url = new URL(req.url, "http://localhost");
    const match = /^\/repos\/([^/]+\/[^/]+)(\/.*)?$/.exec(url.pathname);
    const repo = match && repos.get(match[1]);
    if (!repo) return send(res, 404, { message: "Not Found" });
    const rest = match[2] ?? "";
    if (!rest) return send(res, 200, { private: repo.private });

    const blob = /^\/git\/blobs\/(\w+)$/.exec(rest);
    if (blob) {
      stats.blobReads++;
      const file = [...repo.files.values()].find((f) => f.sha === blob[1]);
      return file ? send(res, 200, { sha: file.sha, content: file.data.toString("base64"), encoding: "base64" }) : send(res, 404, { message: "Not Found" });
    }

    if (!rest.startsWith("/contents/")) return send(res, 404, { message: "Not Found" });
    const path = decodeURIComponent(rest.slice("/contents/".length));
    const current = repo.files.get(path);

    if (req.method === "GET") {
      if (!current) return send(res, 404, { message: "Not Found" });
      const etag = `"${current.sha}"`;
      if (req.headers["if-none-match"] === etag) {
        stats.notModified++;
        return send(res, 304, undefined, { ETag: etag });
      }
      const big = current.data.length > 1024 * 1024;
      return send(res, 200, { sha: current.sha, path, encoding: big ? "none" : "base64", content: big ? "" : current.data.toString("base64") }, { ETag: etag });
    }

    const body = JSON.parse(raw.toString() || "{}");
    if (req.method === "PUT") {
      if (current && !body.sha) {
        stats.conflicts++;
        return send(res, 422, { message: "sha wasn't supplied" });
      }
      if ((current && body.sha !== current.sha) || (!current && body.sha)) {
        stats.conflicts++;
        return send(res, 409, { message: "does not match" });
      }
      const data = Buffer.from(body.content, "base64");
      const sha = shaOf(data);
      repo.files.set(path, { sha, data });
      repo.commits.push({ message: body.message, path });
      return send(res, current ? 200 : 201, { content: { sha, path }, commit: {} });
    }
    if (req.method === "DELETE") {
      if (!current) return send(res, 404, { message: "Not Found" });
      if (body.sha !== current.sha) {
        stats.conflicts++;
        return send(res, 409, { message: "does not match" });
      }
      repo.files.delete(path);
      repo.commits.push({ message: body.message, path });
      return send(res, 200, { commit: {} });
    }
    return send(res, 405, { message: "Method Not Allowed" });
  }

  return { server, repos, stats, shaOf };
}

module.exports = { createFakeGitHub };

if (require.main === module) {
  const port = Number(process.argv[2] || 3998);
  createFakeGitHub({ token: process.env.GITHUB_STORAGE_TOKEN || "test-token" }).server.listen(port, () => console.log(`Fake GitHub on ${port}`));
}

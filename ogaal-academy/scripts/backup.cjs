// Backs up the MySQL database and private file storage, deletes backups past the retention period
// and records the outcome in system_settings for the dashboard. Usage: npm run backup
// Destination is BACKUP_DIR. Keep it outside the repository and copy it off the server.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { spawn, spawnSync } = require("node:child_process");
const { pipeline } = require("node:stream/promises");
const { connect } = require("./_env.cjs");

const root = process.cwd();
const backupDir = path.resolve(root, process.env.BACKUP_DIR || "backups");
const storageDir = path.resolve(root, process.env.STORAGE_DIR || "storage");
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 30);
const mysqldump = process.env.MYSQLDUMP_PATH || "mysqldump";

async function dumpDatabase(target) {
  // Credentials go in a private temporary file so the password never appears in the process list.
  const credentials = path.join(backupDir, `.credentials-${process.pid}.cnf`);
  const quote = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  fs.writeFileSync(credentials, `[client]
user=${quote(process.env.DB_USER)}
password=${quote(process.env.DB_PASSWORD || "")}
host=${quote(process.env.DB_HOST)}
port=${Number(process.env.DB_PORT || 3306)}
`, { mode: 0o600 });
  // --defaults-extra-file must come first.
  const child = spawn(mysqldump, [`--defaults-extra-file=${credentials}`, "--single-transaction", "--no-tablespaces", "--default-character-set=utf8mb4", process.env.DB_NAME], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  const exited = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  let code;
  try {
    await pipeline(child.stdout, zlib.createGzip(), fs.createWriteStream(target, { mode: 0o600 }));
    code = await exited;
  } finally {
    fs.rmSync(credentials, { force: true });
  }
  if (code !== 0) throw new Error(`mysqldump exited with code ${code}: ${stderr.trim().slice(0, 300)}`);
}

function archiveStorage(target) {
  if (!fs.existsSync(storageDir)) return false;
  // Relative paths and cwd: tar reads the colon in a Windows drive path as a remote host.
  const res = spawnSync("tar", ["-czf", path.basename(target), "-C", path.relative(backupDir, storageDir), "."], { cwd: backupDir });
  if (res.status !== 0) throw new Error(`tar failed: ${String(res.stderr || res.error).slice(0, 300)}`);
  fs.chmodSync(target, 0o600);
  return true;
}

function prune() {
  const cutoff = Date.now() - retentionDays * 86400000;
  let removed = 0;
  for (const f of fs.readdirSync(backupDir)) {
    if (!/^ogaal-(db|files)-.*\.(sql|tar)\.gz$/.test(f)) continue;
    const p = path.join(backupDir, f);
    if (fs.statSync(p).mtimeMs < cutoff) {
      fs.rmSync(p);
      removed++;
    }
  }
  return removed;
}

(async () => {
  const db = await connect();
  const record = (key, value) =>
    db.execute("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [key, value]);
  const startedAt = new Date().toISOString();
  try {
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const stamp = startedAt.replace(/[:.]/g, "-");
    const dbFile = path.join(backupDir, `ogaal-db-${stamp}.sql.gz`);
    await dumpDatabase(dbFile);
    if (fs.statSync(dbFile).size < 100) throw new Error("Database dump is unexpectedly small");
    const hasFiles = archiveStorage(path.join(backupDir, `ogaal-files-${stamp}.tar.gz`));
    const removed = prune();
    await record("backup_last_success_at", startedAt);
    await record("backup_last_status", "ok");
    await record("backup_last_error", "");
    console.log(`Backup complete: ${path.basename(dbFile)}${hasFiles ? " and file storage archive" : ""}. Removed ${removed} old file(s).`);
  } catch (err) {
    await record("backup_last_status", "failed");
    await record("backup_last_error", String(err.message).slice(0, 500));
    console.error("Backup failed:", err.message);
    process.exitCode = 1;
  } finally {
    await record("backup_last_attempt_at", startedAt);
    await db.end();
  }
})();

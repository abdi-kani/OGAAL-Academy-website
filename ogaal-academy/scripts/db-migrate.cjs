// Applies db/migrations/*.sql in name order, once each. Usage: npm run db:migrate
const fs = require("node:fs");
const path = require("node:path");
const { connect } = require("./_env.cjs");

(async () => {
  const db = await connect({ multipleStatements: true });
  await db.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(190) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) DEFAULT CHARSET=utf8mb4",
  );
  const dir = path.join(process.cwd(), "db", "migrations");
  const [rows] = await db.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const pending = fs.readdirSync(dir).filter((f) => f.endsWith(".sql") && !applied.has(f)).sort();
  for (const file of pending) {
    await db.query(fs.readFileSync(path.join(dir, file), "utf8"));
    await db.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
    console.log(`Applied ${file}`);
  }
  console.log(pending.length ? "Migrations complete." : "Database is already up to date.");
  await db.end();
})().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});

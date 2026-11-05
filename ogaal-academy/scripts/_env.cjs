// Shared by the command-line scripts: loads .env files the same way Next.js does and opens the database.
const { loadEnvConfig } = require("@next/env");
const mysql = require("mysql2/promise");

loadEnvConfig(process.cwd());

function connect(extra = {}) {
  const missing = ["DB_HOST", "DB_NAME", "DB_USER"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing ${missing.join(", ")}. Set them in .env.local (see .env.example).`);
    process.exit(1);
  }
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    dateStrings: true,
    ...extra,
  });
}

module.exports = { connect };

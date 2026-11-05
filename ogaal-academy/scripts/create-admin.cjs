// Creates the first Super Admin. There is no default account.
// Usage: npm run db:create-admin
// Reads ADMIN_FULL_NAME, ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD, prompting for any not set.
const crypto = require("node:crypto");
const readline = require("node:readline/promises");
const { connect } = require("./_env.cjs");

const N = 131072, R = 8, P = 1;
const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(`scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`),
    );
  });

(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (env, label) => process.env[env] || (await rl.question(`${label}: `)).trim();
  const fullName = await ask("ADMIN_FULL_NAME", "Full name");
  const username = await ask("ADMIN_USERNAME", "Username");
  const email = await ask("ADMIN_EMAIL", "Email");
  const password = await ask("ADMIN_PASSWORD", "Password (10 characters or more)");
  rl.close();
  if (!fullName || !username || !email.includes("@") || password.length < 10) {
    console.error("A full name, username, valid email and a password of 10 or more characters are required.");
    process.exit(1);
  }
  const db = await connect();
  await db.execute(
    "INSERT INTO users (full_name, username, email, password_hash, role) VALUES (?, ?, ?, ?, 'Super Admin')",
    [fullName, username.toLowerCase(), email.toLowerCase(), await hashPassword(password)],
  );
  console.log(`Super Admin "${username}" created.`);
  await db.end();
})().catch((err) => {
  console.error(err.code === "ER_DUP_ENTRY" ? "That username or email already exists." : err.message);
  process.exit(1);
});

#!/usr/bin/env node
// Creates admin credentials and the secret keys. Prints them for you to paste into Vercel or .env.local; stores nothing.
//   npm run admin:setup               first-time setup: account plus new keys
//   npm run admin:setup -- --account  another account or a new password; keeps your existing keys
// Non-interactive: set ADMIN_SETUP_USERNAME and ADMIN_SETUP_PASSWORD.
const crypto = require("crypto");
const readline = require("readline");

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) rl._writeToOutput = (s) => { if (s.startsWith(question)) process.stdout.write(s); };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function hash(password) {
  const [N, r, p] = [131072, 8, 1];
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64, { N, r, p, maxmem: 256 * 1024 * 1024 });
  return `scrypt.${N}.${r}.${p}.${salt.toString("base64url")}.${key.toString("base64url")}`;
}

(async () => {
  const username = (process.env.ADMIN_SETUP_USERNAME || (await ask("Username: "))).trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,60}$/.test(username)) throw new Error("Username: 3 to 60 letters, numbers, dots, dashes or underscores.");
  const password = process.env.ADMIN_SETUP_PASSWORD || (await ask("Password (at least 12 characters): ", true));
  if (password.length < 12 || password.length > 200) throw new Error("Password must be 12 to 200 characters.");
  console.log("\nAdd these as environment variables. Do not commit them.\n");
  console.log(`ADMIN_USERS=${username}:${hash(password)}`);
  if (process.argv.includes("--account")) {
    console.log("\nFor several administrators, separate accounts with a comma.");
    return;
  }
  console.log(`ADMIN_SESSION_SECRET=${crypto.randomBytes(48).toString("base64url")}`);
  console.log(`DATA_ENCRYPTION_KEY=${crypto.randomBytes(32).toString("base64")}`);
  console.log("\nKeep a safe copy of DATA_ENCRYPTION_KEY outside GitHub and Vercel. If it is lost, the employee data cannot be recovered.");
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

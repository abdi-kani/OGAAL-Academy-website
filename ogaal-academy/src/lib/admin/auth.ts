import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const MAXMEM = 256 * 1024 * 1024;

export const SESSION_COOKIE = "ogaal_admin";
const SESSION_HOURS = 8;

export type Admin = { username: string };

/** ADMIN_USERS is "name:hash,name:hash". Hashes come from `npm run admin:setup`. */
function accounts(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of (process.env.ADMIN_USERS ?? "").split(",")) {
    const i = entry.indexOf(":");
    if (i > 0) map.set(entry.slice(0, i).trim().toLowerCase(), entry.slice(i + 1).trim());
  }
  return map;
}

const secret = () => process.env.ADMIN_SESSION_SECRET ?? "";
export const isAuthConfigured = () => accounts().size > 0 && secret().length >= 32;

/** Stored as scrypt.N.r.p.salt.hash in base64url: Next.js expands "$" in .env files, so it is avoided here. */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, N, r, p, salt, hash] = stored.split(".");
  if (scheme !== "scrypt" || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await scrypt(password, Buffer.from(salt, "base64url"), expected.length, { N: Number(N), r: Number(r), p: Number(p), maxmem: MAXMEM });
  return crypto.timingSafeEqual(key, expected);
}

/** Checked against when the username is unknown, so response time doesn't reveal which accounts exist. */
const DECOY = `scrypt.131072.8.1.${crypto.randomBytes(16).toString("base64url")}.${crypto.randomBytes(64).toString("base64url")}`;

export async function checkLogin(username: string, password: string): Promise<Admin | null> {
  const name = username.trim().toLowerCase();
  const stored = accounts().get(name);
  const ok = await verifyPassword(password, stored ?? DECOY);
  return stored && ok ? { username: name } : null;
}

const sign = (payload: string) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
/** Ties a session to the password hash, so changing a password or removing an account ends its sessions. */
const fingerprint = (stored: string) => crypto.createHash("sha256").update(stored).digest("base64url").slice(0, 16);

export function createSessionToken(admin: Admin): { token: string; maxAge: number } {
  const maxAge = SESSION_HOURS * 3600;
  const payload = Buffer.from(JSON.stringify({ u: admin.username, f: fingerprint(accounts().get(admin.username) ?? ""), exp: Math.floor(Date.now() / 1000) + maxAge })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, maxAge };
}

function readSessionToken(token: string): Admin | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const { u, f, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u: string; f: string; exp: number };
    const stored = accounts().get(u);
    if (!stored || f !== fingerprint(stored) || exp * 1000 <= Date.now()) return null;
    return { username: u };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // COOKIE_SECURE=false is for testing over plain HTTP only.
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export const getAdmin = cache(async (): Promise<Admin | null> => {
  if (!isAuthConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? readSessionToken(token) : null;
});

/** For pages: sends visitors without a valid session to the login page. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

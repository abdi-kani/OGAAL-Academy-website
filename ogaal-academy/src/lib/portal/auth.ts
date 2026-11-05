import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDbConfigured, query, queryOne, run } from "./db";
import { can, homePath, type Permission, type Role } from "./permissions";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const MAXMEM = 256 * 1024 * 1024;
const SCRYPT = { N: 131072, r: 8, p: 1 };

export const SESSION_COOKIE = "ogaal_session";
export const SESSION_HOURS = 12;

export type PortalUser = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone_number: string | null;
  profile_photo: string | null;
  role: Role;
  assigned_company: string | null;
  account_status: "Active" | "Inactive";
  must_change_password: number;
  last_login: string | null;
};

const USER_COLUMNS = "u.id, u.full_name, u.username, u.email, u.phone_number, u.profile_photo, u.role, u.assigned_company, u.account_status, u.must_change_password, u.last_login";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64, { ...SCRYPT, maxmem: MAXMEM });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, N, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { N: Number(N), r: Number(r), p: Number(p), maxmem: MAXMEM });
  return crypto.timingSafeEqual(key, expected);
}

/** Verified against when the username is unknown, so response time doesn't reveal which accounts exist. */
let decoyHash: Promise<string> | null = null;
export function decoyPasswordCheck(password: string): Promise<boolean> {
  decoyHash ??= hashPassword(crypto.randomBytes(16).toString("hex"));
  return decoyHash.then((h) => verifyPassword(password, h));
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 200) return "Use 200 characters or fewer.";
  return null;
}

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export function randomPassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

export async function createSession(userId: number, ip: string, userAgent: string): Promise<{ token: string; maxAge: number }> {
  const token = crypto.randomBytes(32).toString("base64url");
  await run("INSERT INTO user_sessions (token_hash, user_id, expires_at, ip_address, user_agent) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ? HOUR, ?, ?)", [
    sha256(token),
    userId,
    SESSION_HOURS,
    ip.slice(0, 64),
    userAgent.slice(0, 255),
  ]);
  return { token, maxAge: SESSION_HOURS * 3600 };
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

export async function destroySession(token: string): Promise<void> {
  await run("DELETE FROM user_sessions WHERE token_hash = ?", [sha256(token)]);
}

export async function destroyUserSessions(userId: number, exceptToken?: string): Promise<void> {
  if (exceptToken) await run("DELETE FROM user_sessions WHERE user_id = ? AND token_hash <> ?", [userId, sha256(exceptToken)]);
  else await run("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
}

export const getCurrentUser = cache(async (): Promise<PortalUser | null> => {
  if (!isDbConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return queryOne<PortalUser>(
    `SELECT ${USER_COLUMNS} FROM user_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.account_status = 'Active'`,
    [sha256(token)],
  );
});

/** For pages: signs the visitor in if needed, and sends them home if their role lacks the permission. */
export async function requirePage(permission?: Permission, opts: { allowPasswordChangePending?: boolean } = {}): Promise<PortalUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  if (user.must_change_password && !opts.allowPasswordChangePending) redirect("/portal/account?required=1");
  if (permission && !can(user.role, permission)) redirect(homePath(user.role));
  return user;
}

export async function purgeExpiredAuthRows(): Promise<void> {
  await query("DELETE FROM user_sessions WHERE expires_at < UTC_TIMESTAMP()");
  await query("DELETE FROM password_resets WHERE expires_at < UTC_TIMESTAMP() - INTERVAL 7 DAY");
}

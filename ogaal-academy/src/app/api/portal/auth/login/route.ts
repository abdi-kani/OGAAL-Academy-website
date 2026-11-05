import { NextResponse, type NextRequest } from "next/server";
import { ApiError, errorResponse, isSameOrigin, readJson, requestIp } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { SESSION_COOKIE, createSession, decoyPasswordCheck, sessionCookieOptions, verifyPassword } from "@/lib/portal/auth";
import { isDbConfigured, queryOne, run } from "@/lib/portal/db";
import { homePath, type Role } from "@/lib/portal/permissions";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const WINDOW = 15 * 60 * 1000;
const WRONG = "Incorrect username or password.";

export async function POST(req: NextRequest) {
  try {
    if (!isDbConfigured()) throw new ApiError(503, "The portal database is not configured.");
    if (!isSameOrigin(req)) throw new ApiError(403, "Request blocked.");
    const body = await readJson(req);
    const login = typeof body.login === "string" ? body.login.trim().toLowerCase().slice(0, 190) : "";
    const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
    if (!login || !password) throw new ApiError(422, "Enter your username or email, and your password.");

    const ip = requestIp(req);
    // The per-account limit holds even if an attacker rotates addresses or forwarding headers.
    const limited = [rateLimit(`login:acct:${login}`, 8, WINDOW), rateLimit(`login:ip:${ip}`, 30, WINDOW)].find((r) => !r.ok);
    if (limited) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      );
    }

    const user = await queryOne<{ id: number; password_hash: string; role: Role; account_status: string; must_change_password: number }>(
      "SELECT id, password_hash, role, account_status, must_change_password FROM users WHERE username = ? OR email = ? LIMIT 1",
      [login, login],
    );
    const passwordOk = user ? await verifyPassword(password, user.password_hash) : await decoyPasswordCheck(password);
    if (!user || !passwordOk) {
      await audit({ userId: user?.id ?? null, action: "auth.login_failed", recordType: "user", recordRef: user?.id, ip });
      throw new ApiError(401, WRONG);
    }
    // Only someone holding the right password learns that an account is deactivated.
    if (user.account_status !== "Active") {
      await audit({ userId: user.id, action: "auth.login_blocked", recordType: "user", recordRef: user.id, ip });
      throw new ApiError(403, "This account has been deactivated. Please contact an administrator.");
    }

    const session = await createSession(user.id, ip, req.headers.get("user-agent") ?? "");
    await run("UPDATE users SET last_login = UTC_TIMESTAMP() WHERE id = ?", [user.id]);
    await audit({ userId: user.id, action: "auth.login", recordType: "user", recordRef: user.id, ip });
    const res = NextResponse.json({ ok: true, redirect: user.must_change_password ? "/portal/account?required=1" : homePath(user.role) });
    res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.maxAge));
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

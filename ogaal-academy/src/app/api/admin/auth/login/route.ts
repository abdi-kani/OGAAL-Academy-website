import { NextResponse, type NextRequest } from "next/server";
import { ApiError, errorResponse, isSameOrigin, readJson, requestIp } from "@/lib/admin/api";
import { audit } from "@/lib/admin/audit";
import { SESSION_COOKIE, checkLogin, createSessionToken, isAuthConfigured, sessionCookieOptions } from "@/lib/admin/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isAuthConfigured()) throw new ApiError(503, "The admin system is not configured.");
    if (!isSameOrigin(req)) throw new ApiError(403, "Request blocked.");
    const ip = requestIp(req);
    const body = await readJson(req);
    const username = typeof body.username === "string" ? body.username.slice(0, 100) : "";
    const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
    const byIp = rateLimit(`admin-login-ip:${ip}`, 20, 15 * 60 * 1000);
    const byName = rateLimit(`admin-login-user:${username.toLowerCase()}`, 10, 15 * 60 * 1000);
    if (!byIp.ok || !byName.ok) throw new ApiError(429, "Too many attempts. Please wait a few minutes and try again.");
    const admin = await checkLogin(username, password);
    if (!admin) throw new ApiError(401, "Incorrect username or password.");
    const { token, maxAge } = createSessionToken(admin);
    await audit(admin.username, "auth.login", ip);
    const res = NextResponse.json({ redirect: "/admin/dashboard" });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

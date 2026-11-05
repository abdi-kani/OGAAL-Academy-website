import { NextResponse, type NextRequest } from "next/server";
import { ApiError, errorResponse, isSameOrigin, requestIp } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { SESSION_COOKIE, destroySession, getCurrentUser, sessionCookieOptions } from "@/lib/portal/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) throw new ApiError(403, "Request blocked.");
    const user = await getCurrentUser();
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (token) await destroySession(token);
    if (user) await audit({ userId: user.id, action: "auth.logout", recordType: "user", recordRef: user.id, ip: requestIp(req) });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

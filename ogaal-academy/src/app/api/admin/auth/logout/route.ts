import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { audit } from "@/lib/admin/audit";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin/auth";

export const runtime = "nodejs";

export const POST = adminRoute(async ({ admin, ip }) => {
  await audit(admin.username, "auth.logout", ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
});

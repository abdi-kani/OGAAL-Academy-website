import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendSystemEmail } from "@/lib/email";
import { ApiError, errorResponse, isSameOrigin, readJson, requestIp } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { sha256 } from "@/lib/portal/auth";
import { portalBaseUrl } from "@/lib/portal/certificate-pdf";
import { isDbConfigured, queryOne, run } from "@/lib/portal/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const WINDOW = 15 * 60 * 1000;

/** Always answers the same way, so this form can't be used to discover which accounts exist. */
export async function POST(req: NextRequest) {
  try {
    if (!isDbConfigured()) throw new ApiError(503, "The portal database is not configured.");
    if (!isSameOrigin(req)) throw new ApiError(403, "Request blocked.");
    const body = await readJson(req);
    const login = typeof body.login === "string" ? body.login.trim().toLowerCase().slice(0, 190) : "";
    const ip = requestIp(req);
    if (login && rateLimit(`forgot:acct:${login}`, 3, WINDOW).ok && rateLimit(`forgot:ip:${ip}`, 10, WINDOW).ok) {
      const user = await queryOne<{ id: number; email: string }>("SELECT id, email FROM users WHERE (username = ? OR email = ?) AND account_status = 'Active' LIMIT 1", [login, login]);
      if (user) {
        const token = crypto.randomBytes(32).toString("base64url");
        await run("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 1 HOUR)", [sha256(token), user.id]);
        // The link is built from configuration, never from the request's Host header, which an attacker can set.
        const link = `${portalBaseUrl()}/portal/reset-password?token=${token}`;
        const sent = await sendSystemEmail(
          user.email,
          "Reset your OGAAL Academy portal password",
          `A password reset was requested for your OGAAL Academy portal account.\n\nThis link works once and expires in one hour:\n${link}\n\nIf you did not ask for this, you can ignore this email. Your password has not changed.`,
        ).catch((err) => {
          console.error("Password reset email failed:", err.message);
          return false;
        });
        await audit({ userId: user.id, action: "auth.password_reset_requested", recordType: "user", recordRef: user.id, details: { email_sent: sent }, ip });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

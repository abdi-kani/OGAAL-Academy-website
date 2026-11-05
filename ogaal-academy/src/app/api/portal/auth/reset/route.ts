import { NextResponse, type NextRequest } from "next/server";
import { ApiError, errorResponse, isSameOrigin, readJson, requestIp } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { destroyUserSessions, hashPassword, passwordProblem, sha256 } from "@/lib/portal/auth";
import { isDbConfigured, queryOne, run } from "@/lib/portal/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isDbConfigured()) throw new ApiError(503, "The portal database is not configured.");
    if (!isSameOrigin(req)) throw new ApiError(403, "Request blocked.");
    const ip = requestIp(req);
    if (!rateLimit(`reset:ip:${ip}`, 10, 15 * 60 * 1000).ok) throw new ApiError(429, "Too many attempts. Please wait and try again.");
    const body = await readJson(req);
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const problem = passwordProblem(password);
    if (problem) throw new ApiError(422, problem, { password: problem });

    const invalid = new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");
    if (!token) throw invalid;
    const hash = sha256(token);
    const row = await queryOne<{ user_id: number }>(
      "SELECT r.user_id FROM password_resets r JOIN users u ON u.id = r.user_id WHERE r.token_hash = ? AND r.used_at IS NULL AND r.expires_at > UTC_TIMESTAMP() AND u.account_status = 'Active'",
      [hash],
    );
    if (!row) throw invalid;
    // Claiming the token with a conditional update makes it single-use even if two requests race.
    const claimed = await run("UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE token_hash = ? AND used_at IS NULL", [hash]);
    if (!claimed.affectedRows) throw invalid;

    await run("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", [await hashPassword(password), row.user_id]);
    await destroyUserSessions(row.user_id);
    await audit({ userId: row.user_id, action: "auth.password_reset", recordType: "user", recordRef: row.user_id, ip });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

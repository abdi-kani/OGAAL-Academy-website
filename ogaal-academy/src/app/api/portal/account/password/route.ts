import { NextResponse } from "next/server";
import { ApiError, portalRoute, readJson } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { SESSION_COOKIE, destroyUserSessions, hashPassword, passwordProblem, verifyPassword } from "@/lib/portal/auth";
import { queryOne, run } from "@/lib/portal/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export const POST = portalRoute({ allowPasswordChangePending: true }, async ({ req, user, ip }) => {
  if (!rateLimit(`password:${user.id}`, 8, 15 * 60 * 1000).ok) throw new ApiError(429, "Too many attempts. Please wait and try again.");
  const body = await readJson(req);
  const current = typeof body.current === "string" ? body.current : "";
  const next = typeof body.next === "string" ? body.next : "";
  const row = await queryOne<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [user.id]);
  if (!row || !(await verifyPassword(current.slice(0, 200), row.password_hash))) throw new ApiError(422, "Please check the highlighted fields.", { current: "Your current password is not correct." });
  const problem = passwordProblem(next);
  if (problem) throw new ApiError(422, "Please check the highlighted fields.", { next: problem });
  if (next === current) throw new ApiError(422, "Please check the highlighted fields.", { next: "Choose a different password." });
  await run("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", [await hashPassword(next), user.id]);
  // Sign out every other device; this one stays signed in.
  await destroyUserSessions(user.id, req.cookies.get(SESSION_COOKIE)?.value);
  await audit({ userId: user.id, action: "auth.password_changed", recordType: "user", recordRef: user.id, ip });
  return NextResponse.json({ ok: true });
});

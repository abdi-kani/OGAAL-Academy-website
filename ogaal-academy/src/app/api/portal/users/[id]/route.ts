import { NextResponse } from "next/server";
import { ApiError, parseId, portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { destroyUserSessions, hashPassword, randomPassword, type PortalUser } from "@/lib/portal/auth";
import { isDuplicateError, queryOne, run } from "@/lib/portal/db";
import { companyScope } from "@/lib/portal/employees";
import { manageableRoles, type Role } from "@/lib/portal/permissions";
import { removeFile, saveImage, uploadedFile } from "@/lib/portal/storage";
import { parseUser } from "@/lib/portal/user-input";

export const runtime = "nodejs";

type P = { id: string };

async function loadTarget(actor: PortalUser, id: number) {
  const target = await queryOne<{ id: number; role: Role; account_status: string; profile_photo: string | null; assigned_company: string | null }>("SELECT id, role, account_status, profile_photo, assigned_company FROM users WHERE id = ?", [id]);
  if (!target) throw new ApiError(404, "User not found.");
  const scope = companyScope(actor);
  if (!manageableRoles(actor.role).includes(target.role) || (scope && target.assigned_company !== scope)) throw new ApiError(403, "You cannot manage this account.");
  return target;
}

async function activeSuperAdmins(): Promise<number> {
  const row = await queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role = 'Super Admin' AND account_status = 'Active'");
  return Number(row?.c ?? 0);
}

export const PATCH = portalRoute<P>({ permission: "users.manage" }, async ({ req, user, params, ip }) => {
  const id = parseId(params.id);
  const target = await loadTarget(user, id);
  const form = await req.formData();
  const input = parseUser(form);
  input.assigned_company = companyScope(user) ?? input.assigned_company;
  if (!manageableRoles(user.role).includes(input.role)) throw new ApiError(403, "You cannot assign that role.");
  if (id === user.id && (input.role !== target.role || input.account_status !== target.account_status)) {
    throw new ApiError(422, "You cannot change your own role or deactivate your own account.");
  }
  const losesSuperAdmin = target.role === "Super Admin" && target.account_status === "Active" && (input.role !== "Super Admin" || input.account_status !== "Active");
  if (losesSuperAdmin && (await activeSuperAdmins()) <= 1) throw new ApiError(422, "There must always be at least one active Super Admin.");

  const photo = uploadedFile(form.get("profile_photo"));
  const photoPath = photo ? await saveImage(photo, { folder: "profiles", maxWidth: 400, maxHeight: 400, format: "jpeg", field: "profile_photo" }) : null;
  try {
    await run(
      "UPDATE users SET full_name = ?, username = ?, email = ?, phone_number = ?, role = ?, assigned_company = ?, account_status = ?, profile_photo = COALESCE(?, profile_photo) WHERE id = ?",
      [input.full_name, input.username, input.email, input.phone_number, input.role, input.assigned_company, input.account_status, photoPath, id],
    );
  } catch (err) {
    await removeFile(photoPath);
    if (isDuplicateError(err)) throw new ApiError(409, "That username or email is already in use.", { username: "This username or email is already in use.", email: "This username or email is already in use." });
    throw err;
  }
  if (photoPath) await removeFile(target.profile_photo);
  if (input.account_status === "Inactive" || input.role !== target.role) await destroyUserSessions(id);
  await audit({ userId: user.id, action: "user.update", recordType: "user", recordRef: id, details: { role: input.role, status: input.account_status }, ip });
  return NextResponse.json({ ok: true });
});

/** Administrator password reset: issues a temporary password and signs the user out everywhere. */
export const POST = portalRoute<P>({ permission: "users.manage" }, async ({ user, params, ip }) => {
  const id = parseId(params.id);
  await loadTarget(user, id);
  if (id === user.id) throw new ApiError(422, "Use My Account to change your own password.");
  const temporaryPassword = randomPassword();
  await run("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?", [await hashPassword(temporaryPassword), id]);
  await destroyUserSessions(id);
  await audit({ userId: user.id, action: "user.password_reset", recordType: "user", recordRef: id, ip });
  return NextResponse.json({ ok: true, temporaryPassword });
});

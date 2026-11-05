import { NextResponse } from "next/server";
import { ApiError, portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { hashPassword, randomPassword } from "@/lib/portal/auth";
import { isDuplicateError, run } from "@/lib/portal/db";
import { companyScope } from "@/lib/portal/employees";
import { manageableRoles } from "@/lib/portal/permissions";
import { removeFile, saveImage, uploadedFile } from "@/lib/portal/storage";
import { parseUser } from "@/lib/portal/user-input";

export const runtime = "nodejs";

export const POST = portalRoute({ permission: "users.manage" }, async ({ req, user, ip }) => {
  const form = await req.formData();
  const input = parseUser(form);
  // A company-limited admin can only create users inside that company, never one with wider access.
  input.assigned_company = companyScope(user) ?? input.assigned_company;
  if (!manageableRoles(user.role).includes(input.role)) throw new ApiError(403, "You cannot create an account with that role.");
  const photo = uploadedFile(form.get("profile_photo"));
  const photoPath = photo ? await saveImage(photo, { folder: "profiles", maxWidth: 400, maxHeight: 400, format: "jpeg", field: "profile_photo" }) : null;
  // Shown once to the administrator. The user must replace it at first sign-in.
  const temporaryPassword = randomPassword();
  try {
    const res = await run(
      `INSERT INTO users (full_name, username, email, phone_number, password_hash, must_change_password, profile_photo, role, assigned_company, account_status)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      [input.full_name, input.username, input.email, input.phone_number, await hashPassword(temporaryPassword), photoPath, input.role, input.assigned_company, input.account_status],
    );
    await audit({ userId: user.id, action: "user.create", recordType: "user", recordRef: res.insertId, details: { role: input.role }, ip });
    return NextResponse.json({ ok: true, id: res.insertId, temporaryPassword }, { status: 201 });
  } catch (err) {
    await removeFile(photoPath);
    if (isDuplicateError(err)) throw new ApiError(409, "That username or email is already in use.", { username: "This username or email is already in use.", email: "This username or email is already in use." });
    throw err;
  }
});

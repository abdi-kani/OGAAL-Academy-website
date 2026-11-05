import { NextResponse } from "next/server";
import { ApiError, parseId, portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { generatePdf, issueIfQualified } from "@/lib/portal/certificates";
import { isDuplicateError, run } from "@/lib/portal/db";
import { certificateHistory, companyScope, getEmployee } from "@/lib/portal/employees";
import { can } from "@/lib/portal/permissions";
import { removeFile, saveImage, uploadedFile } from "@/lib/portal/storage";
import { parseEmployee } from "@/lib/portal/validation";

export const runtime = "nodejs";

type P = { id: string };

// A change to any of these alters the printed certificate.
const PRINTED = ["full_name", "company_name", "employee_id", "job_position", "training_date"] as const;

export const PATCH = portalRoute<P>({ permission: "employees.edit" }, async ({ req, user, params, ip }) => {
  const id = parseId(params.id);
  const row = await getEmployee(user, id);
  if (!row) throw new ApiError(404, "Employee not found.");
  if (row.certificate_number && !can(user.role, "employees.editIssued")) {
    throw new ApiError(403, "This record has a certificate. Please ask an administrator to change it.");
  }
  const form = await req.formData();
  const scope = companyScope(user);
  if (scope) form.set("company_name", scope);
  const input = parseEmployee(form);
  const photo = uploadedFile(form.get("employee_photo"));
  const photoPath = photo ? await saveImage(photo, { folder: "photos", maxWidth: 800, maxHeight: 1000, format: "jpeg", field: "employee_photo" }) : null;
  try {
    await run(
      `UPDATE employee_certificates SET full_name = ?, company_name = ?, employee_id = ?, phone_number = ?, blood_group = ?, date_of_birth = ?, job_position = ?, training_date = ?, employee_photo = COALESCE(?, employee_photo) WHERE id = ?`,
      [input.full_name, input.company_name, input.employee_id, input.phone_number, input.blood_group, input.date_of_birth, input.job_position, input.training_date, photoPath, id],
    );
  } catch (err) {
    await removeFile(photoPath);
    if (isDuplicateError(err)) throw new ApiError(409, "This Employee ID is already registered.", { employee_id: "This Employee ID is already registered." });
    throw err;
  }
  if (photoPath) await removeFile(row.employee_photo);
  // Field names only: the log records that a value changed, not the personal data itself.
  const changed = (Object.keys(input) as (keyof typeof input)[]).filter((k) => (row[k] ?? null) !== (input[k] ?? null));
  if (photoPath) (changed as string[]).push("employee_photo");
  await audit({ userId: user.id, action: "employee.update", recordType: "employee", recordRef: id, details: { changed }, ip });

  let certificateNumber: string | null = null;
  if (row.certificate_number) {
    if (photoPath || PRINTED.some((k) => changed.includes(k))) {
      await generatePdf(id);
      await audit({ userId: user.id, action: "certificate.regenerate", recordType: "employee", recordRef: id, details: { certificate_number: row.certificate_number, reason: "record updated" }, ip });
    }
  } else {
    certificateNumber = await issueIfQualified(id, user.id, ip);
  }
  return NextResponse.json({ ok: true, id, certificate_number: certificateNumber });
});

export const DELETE = portalRoute<P>({ permission: "employees.delete" }, async ({ req, user, params, ip }) => {
  const id = parseId(params.id);
  const row = await getEmployee(user, id);
  if (!row) throw new ApiError(404, "Employee not found.");
  // The typed Employee ID is the confirmation, enforced here as well as in the browser.
  const { confirm } = (await req.json().catch(() => ({}))) as { confirm?: unknown };
  if (confirm !== row.employee_id) throw new ApiError(422, "Type the Employee ID exactly to confirm deletion.");
  await run("DELETE FROM employee_certificates WHERE id = ?", [id]);
  await Promise.all([
    removeFile(row.employee_photo),
    removeFile(row.certificate_pdf_path),
    ...certificateHistory(row).map((h) => removeFile(h.pdf_path)),
  ]);
  await audit({ userId: user.id, action: "employee.delete", recordType: "employee", recordRef: id, details: { employee_id: row.employee_id, certificate_number: row.certificate_number }, ip });
  return NextResponse.json({ ok: true });
});

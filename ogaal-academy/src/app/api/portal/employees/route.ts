import { NextResponse } from "next/server";
import { ApiError, portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { issueIfQualified } from "@/lib/portal/certificates";
import { isDuplicateError, run, transaction } from "@/lib/portal/db";
import { applyAssessment } from "@/lib/portal/employee-actions";
import { companyScope } from "@/lib/portal/employees";
import { can } from "@/lib/portal/permissions";
import { getSettings } from "@/lib/portal/settings";
import { removeFile, saveImage, uploadedFile } from "@/lib/portal/storage";
import { parseAssessment, parseEmployee } from "@/lib/portal/validation";

export const runtime = "nodejs";

export const POST = portalRoute({ permission: "employees.create" }, async ({ req, user, ip }) => {
  const form = await req.formData();
  // A company-assigned user always registers into that company, whatever the form says.
  const scope = companyScope(user);
  if (scope) form.set("company_name", scope);
  const input = parseEmployee(form);
  const canAssess = can(user.role, "assessments.manage") && form.get("include_assessment") === "1";
  const assessment = canAssess ? parseAssessment(form, (await getSettings()).assessment_questions) : null;

  const photo = uploadedFile(form.get("employee_photo"));
  const photoPath = photo ? await saveImage(photo, { folder: "photos", maxWidth: 800, maxHeight: 1000, format: "jpeg", field: "employee_photo" }) : null;

  let id: number;
  try {
    id = await transaction(async (conn) => {
      const res = await run(
        `INSERT INTO employee_certificates (full_name, company_name, employee_id, phone_number, blood_group, employee_photo, date_of_birth, job_position, training_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.full_name, input.company_name, input.employee_id, input.phone_number, input.blood_group, photoPath, input.date_of_birth, input.job_position, input.training_date, user.id],
        conn,
      );
      if (assessment) await applyAssessment(res.insertId, assessment, user, null, conn);
      return res.insertId;
    });
  } catch (err) {
    await removeFile(photoPath);
    if (isDuplicateError(err)) throw new ApiError(409, "This Employee ID is already registered.", { employee_id: "This Employee ID is already registered." });
    throw err;
  }
  await audit({ userId: user.id, action: "employee.create", recordType: "employee", recordRef: id, details: { employee_id: input.employee_id }, ip });
  if (assessment) await audit({ userId: user.id, action: assessment.approve ? "assessment.approve" : "assessment.update", recordType: "employee", recordRef: id, details: { result: assessment.assessment_result }, ip });
  const certificateNumber = await issueIfQualified(id, user.id, ip);
  return NextResponse.json({ ok: true, id, certificate_number: certificateNumber }, { status: 201 });
});

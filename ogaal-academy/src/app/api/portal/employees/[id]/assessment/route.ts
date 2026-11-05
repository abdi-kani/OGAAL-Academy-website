import { NextResponse } from "next/server";
import { ApiError, parseId, portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { generatePdf, issueIfQualified } from "@/lib/portal/certificates";
import { applyAssessment } from "@/lib/portal/employee-actions";
import { getEmployee } from "@/lib/portal/employees";
import { getSettings } from "@/lib/portal/settings";
import { parseAssessment } from "@/lib/portal/validation";

export const runtime = "nodejs";

export const POST = portalRoute<{ id: string }>({ permission: "assessments.manage" }, async ({ req, user, params, ip }) => {
  const id = parseId(params.id);
  const row = await getEmployee(user, id);
  if (!row) throw new ApiError(404, "Employee not found.");
  const input = parseAssessment(await req.formData(), (await getSettings()).assessment_questions);
  await applyAssessment(id, input, user, row);
  await audit({ userId: user.id, action: input.approve ? "assessment.approve" : "assessment.update", recordType: "employee", recordRef: id, details: { result: input.assessment_result }, ip });
  let certificateNumber: string | null = null;
  if (row.certificate_number) {
    // The result can appear on the printed certificate.
    if (row.assessment_result !== input.assessment_result) await generatePdf(id);
  } else {
    certificateNumber = await issueIfQualified(id, user.id, ip);
  }
  return NextResponse.json({ ok: true, certificate_number: certificateNumber });
});

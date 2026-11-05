import { NextResponse } from "next/server";
import { ApiError, parseId, portalRoute, readJson } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { disqualifiedReason, generatePdf, issueIfQualified, renewCertificate, revokeCertificate } from "@/lib/portal/certificates";
import { isValidDate, todayStr } from "@/lib/portal/dates";
import { getEmployee } from "@/lib/portal/employees";

export const runtime = "nodejs";

export const POST = portalRoute<{ id: string }>({ permission: "certificates.manage" }, async ({ req, user, params, ip }) => {
  const id = parseId(params.id);
  const row = await getEmployee(user, id);
  if (!row) throw new ApiError(404, "Employee not found.");
  const body = await readJson(req);

  switch (body.action) {
    case "issue": {
      if (row.certificate_number) throw new ApiError(409, "This employee already has a certificate. Renew it instead.");
      const reason = disqualifiedReason(row);
      if (reason) throw new ApiError(409, reason);
      const number = await issueIfQualified(id, user.id, ip);
      return NextResponse.json({ ok: true, certificate_number: number });
    }
    case "regenerate": {
      if (!row.certificate_number) throw new ApiError(409, "This employee has no certificate yet.");
      await generatePdf(id);
      await audit({ userId: user.id, action: "certificate.regenerate", recordType: "employee", recordRef: id, details: { certificate_number: row.certificate_number }, ip });
      return NextResponse.json({ ok: true, certificate_number: row.certificate_number });
    }
    case "renew": {
      const trainingDate = typeof body.training_date === "string" && body.training_date ? body.training_date : null;
      if (trainingDate && (!isValidDate(trainingDate) || trainingDate > todayStr())) {
        throw new ApiError(422, "Enter a valid training date that is not in the future.");
      }
      const number = await renewCertificate(id, user.id, { trainingDate, allowRevoked: user.role === "Super Admin", ip });
      return NextResponse.json({ ok: true, certificate_number: number });
    }
    case "revoke": {
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (reason.length < 3 || reason.length > 255) throw new ApiError(422, "Enter a reason for revoking (3 to 255 characters).");
      await revokeCertificate(id, user.id, reason, ip);
      return NextResponse.json({ ok: true });
    }
    default:
      throw new ApiError(400, "Unknown action.");
  }
});

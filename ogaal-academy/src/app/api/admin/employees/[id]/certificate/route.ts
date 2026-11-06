import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { audit } from "@/lib/admin/audit";
import { issueCertificate } from "@/lib/admin/employees";
import { getSettings } from "@/lib/admin/settings";

export const runtime = "nodejs";

export const POST = adminRoute<{ id: string }>(async ({ admin, params, ip }) => {
  const settings = await getSettings();
  const signature = settings.signatoryName || settings.signatureAsset ? { name: settings.signatoryName, title: settings.signatoryTitle, asset: settings.signatureAsset } : null;
  const record = await issueCertificate(params.id, signature, admin.username);
  await audit(admin.username, "certificate.issue", ip, `${record.certificateNumber}: ${record.fullName} (${record.employeeId})`);
  return NextResponse.json({ certificateNumber: record.certificateNumber });
});

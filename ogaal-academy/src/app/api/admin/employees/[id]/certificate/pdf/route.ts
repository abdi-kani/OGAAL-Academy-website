import { ApiError, adminRoute } from "@/lib/admin/api";
import { audit } from "@/lib/admin/audit";
import { renderCertificatePdf } from "@/lib/admin/certificate-pdf";
import { getEmployee } from "@/lib/admin/employees";
import { getSettings } from "@/lib/admin/settings";

export const runtime = "nodejs";

export const GET = adminRoute<{ id: string }>(async ({ req, admin, params, ip }) => {
  const row = await getEmployee(params.id);
  if (!row) throw new ApiError(404, "Employee not found.");
  if (!row.certificateNumber) throw new ApiError(404, "No certificate has been issued yet.");
  if (row.assessmentResult !== "Passed") throw new ApiError(409, "The assessment result is no longer Passed, so this certificate cannot be printed.");
  const pdf = await renderCertificatePdf(row, await getSettings());
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  await audit(admin.username, inline ? "certificate.print" : "certificate.pdf", ip, row.certificateNumber);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${row.certificateNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});

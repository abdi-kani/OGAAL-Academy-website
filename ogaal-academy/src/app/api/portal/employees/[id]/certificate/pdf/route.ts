import { ApiError, parseId, portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { readCurrentPdf } from "@/lib/portal/certificates";
import { certificateHistory, getEmployee } from "@/lib/portal/employees";
import { readFile } from "@/lib/portal/storage";

export const runtime = "nodejs";

/** Current certificate by default. ?number=CERT-... fetches an earlier one from this employee's history. */
export const GET = portalRoute<{ id: string }>({ permission: "certificates.manage" }, async ({ req, user, params, ip }) => {
  const id = parseId(params.id);
  const row = await getEmployee(user, id);
  if (!row) throw new ApiError(404, "Employee not found.");
  const url = new URL(req.url);
  const requested = url.searchParams.get("number");
  let number = row.certificate_number;
  let pdf: Buffer | null;
  if (requested && requested !== row.certificate_number) {
    const old = certificateHistory(row).find((h) => h.certificate_number === requested);
    if (!old) throw new ApiError(404, "Certificate not found.");
    number = old.certificate_number;
    pdf = old.pdf_path ? await readFile(old.pdf_path) : null;
  } else {
    pdf = await readCurrentPdf(row);
  }
  if (!pdf || !number) throw new ApiError(404, "No certificate PDF is available.");
  const inline = url.searchParams.get("inline") === "1";
  await audit({ userId: user.id, action: inline ? "certificate.view" : "certificate.download", recordType: "employee", recordRef: id, details: { certificate_number: number }, ip });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});

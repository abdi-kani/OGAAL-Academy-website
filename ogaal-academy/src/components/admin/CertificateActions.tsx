"use client";

import { useRouter } from "next/navigation";
import { Award, Download, Printer } from "lucide-react";
import { FormError, useSubmit } from "./form";
import { printCertificate } from "./RowActions";

export function CertificateActions({ id, hasCertificate, canIssue }: { id: string; hasCertificate: boolean; canIssue: boolean }) {
  const router = useRouter();
  const { busy, error, submit } = useSubmit();
  async function issue() {
    if (await submit(`/api/admin/employees/${id}/certificate`, {})) router.refresh();
  }
  return (
    <div className="mt-4 space-y-3">
      <FormError message={error} />
      <div className="flex flex-wrap gap-2">
        {canIssue && (
          <button type="button" onClick={issue} disabled={busy} className="btn btn-primary"><Award size={16} aria-hidden="true" /> {busy ? "Issuing…" : "Generate Certificate"}</button>
        )}
        {hasCertificate && (
          <>
            <a href={`/api/admin/employees/${id}/certificate/pdf`} className="btn btn-outline"><Download size={16} aria-hidden="true" /> Download PDF</a>
            <button type="button" onClick={() => printCertificate(id)} className="btn btn-outline"><Printer size={16} aria-hidden="true" /> Print Certificate</button>
          </>
        )}
      </div>
    </div>
  );
}

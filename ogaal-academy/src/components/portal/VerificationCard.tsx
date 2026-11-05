import { CircleAlert, CircleCheck, CircleHelp, CircleX, type LucideIcon } from "lucide-react";
import type { VerificationResult } from "@/lib/portal/certificates";
import { formatDate } from "@/lib/portal/dates";

const LOOK: Record<VerificationResult["outcome"], { label: string; note: string; icon: LucideIcon; cls: string }> = {
  VALID: { label: "VALID", note: "This certificate is genuine and currently valid.", icon: CircleCheck, cls: "bg-green-50 text-green-900" },
  EXPIRED: { label: "EXPIRED", note: "This certificate is genuine but is no longer valid.", icon: CircleAlert, cls: "bg-amber-50 text-amber-900" },
  REVOKED: { label: "REVOKED", note: "This certificate has been withdrawn by the academy and is not valid.", icon: CircleX, cls: "bg-red-50 text-red-900" },
  NOT_FOUND: { label: "NOT FOUND", note: "No certificate matches this number. Check it and try again, or contact the academy.", icon: CircleHelp, cls: "bg-slate-100 text-slate-800" },
};

/** Public result view. It receives only the fields that are safe to show. */
export function VerificationCard({ result }: { result: VerificationResult }) {
  const look = LOOK[result.outcome];
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className={`flex items-center gap-3 p-5 ${look.cls}`}>
        <look.icon size={32} aria-hidden="true" className="shrink-0" />
        <div>
          <p className="font-display text-2xl font-extrabold">{look.label}</p>
          <p className="text-sm font-medium">{result.outcome !== "NOT_FOUND" && result.replaced && result.outcome === "EXPIRED" ? "This certificate is genuine but has been replaced by a newer one." : look.note}</p>
        </div>
      </div>
      {result.outcome !== "NOT_FOUND" && (
        <>
          <dl className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
            {(
              [
                ["Certificate holder", result.full_name],
                ["Company", result.company_name],
                ["Employee ID", result.employee_id],
                ["Job position", result.job_position],
                ["Certificate number", result.certificate_number],
                ["Status", result.status],
                ["Issue date", formatDate(result.issue_date)],
                ["Expiry date", formatDate(result.expiry_date)],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold">{k}</dt>
                <dd className="font-semibold text-navy">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-line px-5 py-3 text-xs">A training certificate does not replace a firearm licence, permit, or other authorisation required by law.</p>
        </>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { rowPermissions } from "@/components/portal/EmployeeTable";
import { RowActions } from "@/components/portal/RowActions";
import { DetailList, Notice, PageTitle, ResultBadge, StatusBadge } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { disqualifiedReason } from "@/lib/portal/certificates";
import { formatDate, formatDateTime, todayStr } from "@/lib/portal/dates";
import { parseJson, queryOne } from "@/lib/portal/db";
import { certificateHistory, getEmployee } from "@/lib/portal/employees";
import { can } from "@/lib/portal/permissions";

export const metadata: Metadata = { title: "Employee profile" };

export default async function EmployeePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const user = await requirePage("employees.view");
  const { id } = await params;
  const { saved } = await searchParams;
  const row = /^\d+$/.test(id) ? await getEmployee(user, Number(id)) : null;
  if (!row) notFound();
  const perms = rowPermissions(user);
  const canAssess = can(user.role, "assessments.manage");
  const history = certificateHistory(row);
  const answers = parseJson<{ question: string; answer: string }[]>(row.assessment_answers, []);
  const [registrar, approver] = await Promise.all([
    queryOne<{ full_name: string }>("SELECT full_name FROM users WHERE id = ?", [row.created_by]),
    canAssess && row.assessment_approved_by ? queryOne<{ full_name: string }>("SELECT full_name FROM users WHERE id = ?", [row.assessment_approved_by]) : null,
  ]);
  const blocked = row.certificate_number ? null : disqualifiedReason(row);

  return (
    <>
      <PageTitle title={row.full_name} intro={`${row.job_position}, ${row.company_name}`}>
        <RowActions employee={{ id: row.id, full_name: row.full_name, employee_id: row.employee_id, certificate_number: row.certificate_number, certificate_status: row.certificate_status }} perms={perms} today={todayStr()} />
      </PageTitle>
      {saved && <div className="mb-4"><Notice tone="info">Saved.{row.certificate_number ? ` Certificate: ${row.certificate_number}.` : blocked ? ` No certificate yet: ${blocked}` : ""}</Notice></div>}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="panel p-5">
          <h2 className="mb-4">Employee details</h2>
          <div className="flex flex-col gap-5 sm:flex-row">
            {row.employee_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/portal/employees/${row.id}/photo`} alt={`Photo of ${row.full_name}`} className="h-36 w-28 shrink-0 rounded-lg border border-line object-cover" />
            ) : (
              <div className="grid h-36 w-28 shrink-0 place-items-center rounded-lg border border-dashed border-line text-xs">No photo</div>
            )}
            <div className="min-w-0 flex-1">
              <DetailList
                items={[
                  ["Employee ID", row.employee_id],
                  ["Company", row.company_name],
                  ["Job position", row.job_position],
                  ["Phone number", row.phone_number],
                  ["Date of birth", formatDate(row.date_of_birth)],
                  ["Blood group", row.blood_group],
                  ["Training date", formatDate(row.training_date)],
                  ["Registered by", registrar?.full_name],
                  ["Registered on", formatDateTime(row.created_at)],
                  ["Last updated", formatDateTime(row.updated_at)],
                ]}
              />
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4">Certificate</h2>
          <DetailList
            items={[
              ["Status", <StatusBadge key="s" status={row.certificate_status} />],
              ["Certificate number", row.certificate_number],
              ["Issue date", formatDate(row.certificate_issue_date)],
              ["Expiry date", formatDate(row.certificate_expiry_date)],
              ["Validity", row.certificate_number ? row.certificate_validity : null],
              ["Authorized signatory", row.authorized_signatory],
            ]}
          />
          {row.certificate_status === "Revoked" && row.certificate_revocation_reason && <div className="mt-4"><Notice tone="bad">Revoked: {row.certificate_revocation_reason}</Notice></div>}
          {blocked && <div className="mt-4"><Notice>No certificate yet. {blocked}</Notice></div>}
          {history.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm">Earlier certificates</h3>
              <ul className="mt-2 divide-y divide-line text-sm">
                {history.slice().reverse().map((h) => (
                  <li key={h.certificate_number} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium text-navy">{h.certificate_number}</span> · {formatDate(h.issue_date)} to {formatDate(h.expiry_date)}
                    </span>
                    {perms.certificates && h.pdf_path && (
                      <a href={`/api/portal/employees/${row.id}/certificate/pdf?number=${encodeURIComponent(h.certificate_number)}`} className="btn btn-outline btn-sm">
                        <Download size={14} aria-hidden="true" /> PDF
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2>Mental assessment</h2>
            {canAssess && <Link href={`/portal/assessments/${row.id}`} className="btn btn-outline btn-sm">Record assessment</Link>}
          </div>
          <DetailList
            items={[
              ["Result", <ResultBadge key="r" result={row.assessment_result} approved={Boolean(row.assessment_approved_at)} />],
              ["Approval", row.assessment_approved_at ? `Approved${approver ? ` by ${approver.full_name}` : ""}, ${formatDateTime(row.assessment_approved_at)}` : "Not approved"],
              ...(canAssess
                ? ([
                    ["Assessment date", formatDate(row.assessment_date)],
                    ["Assessor", row.assessor_name],
                    ["Mental assessment", row.mental_assessment],
                    ["Remarks", row.assessment_remarks],
                    ...answers.filter((a) => a.answer).map((a) => [a.question, a.answer]),
                  ] as [string, React.ReactNode][])
                : []),
            ]}
          />
          {!canAssess && <p className="mt-3 text-xs">Assessment notes are visible to assessors only.</p>}
        </section>
      </div>
    </>
  );
}

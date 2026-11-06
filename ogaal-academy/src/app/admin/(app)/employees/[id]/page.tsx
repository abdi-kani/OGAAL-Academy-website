import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CertificateActions } from "@/components/admin/CertificateActions";
import { RowActions } from "@/components/admin/RowActions";
import { DetailList, Notice, PageTitle, ResultBadge, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDate, formatDateTime } from "@/lib/admin/dates";
import { certificateStatus, getEmployee, issueBlocker } from "@/lib/admin/employees";

export const metadata: Metadata = { title: "Employee" };

export default async function EmployeePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const row = await getEmployee(id);
  if (!row) notFound();
  const blocker = issueBlocker(row);
  const status = certificateStatus(row);
  const valid = status === "Active" || status === "Expiring Soon";

  return (
    <>
      <PageTitle title={row.fullName} intro={`${row.jobPosition}, ${row.companyName}`}>
        <RowActions employee={{ id: row.id, fullName: row.fullName, employeeId: row.employeeId, certificateNumber: row.certificateNumber, canIssue: !blocker }} />
      </PageTitle>
      {saved && <div className="mb-4"><Notice tone="info">Saved.</Notice></div>}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4">Personal information</h2>
          <div className="flex flex-col gap-5 sm:flex-row">
            {row.employeePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/admin/employees/${row.id}/photo`} alt={`Photo of ${row.fullName}`} className="h-36 w-28 shrink-0 rounded-lg border border-line object-cover" />
            ) : (
              <div className="grid h-36 w-28 shrink-0 place-items-center rounded-lg border border-dashed border-line text-xs">No photo</div>
            )}
            <div className="min-w-0 flex-1">
              <DetailList
                items={[
                  ["Employee ID", row.employeeId],
                  ["Company", row.companyName],
                  ["Job position", row.jobPosition],
                  ["Phone number", row.phoneNumber],
                  ["Date of birth", formatDate(row.dateOfBirth)],
                  ["Blood group", row.bloodGroup],
                  ["Training date", formatDate(row.trainingDate)],
                  ["Last updated", `${formatDateTime(row.updatedAt)} by ${row.updatedBy}`],
                ]}
              />
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4">Certificate</h2>
          <DetailList
            items={[
              ["Status", <StatusBadge key="s" status={status} />],
              ["Certificate number", row.certificateNumber],
              ["Issue date", formatDate(row.certificateIssueDate)],
              ["Expiry date", formatDate(row.certificateExpiryDate)],
              ["Validity", row.certificateValidity],
              ["Authorized signature", row.authorizedSignature?.name],
            ]}
          />
          {blocker && !valid && <div className="mt-4"><Notice>{blocker}</Notice></div>}
          {status === "Expired" && !blocker && <div className="mt-4"><Notice>This certificate has expired. Generating again issues a new number, valid for one year from today.</Notice></div>}
          <CertificateActions id={row.id} hasCertificate={Boolean(row.certificateNumber)} canIssue={!blocker} />
        </section>

        <section className="panel p-5 xl:col-span-2">
          <h2 className="mb-4">Assessment</h2>
          <DetailList
            items={[
              ["Assessment result", <ResultBadge key="r" result={row.assessmentResult} />],
              ["Mental assessment", row.mentalAssessment],
              ["Assessment remarks", row.assessmentRemarks],
            ]}
          />
          <p className="mt-3 text-xs">Private: these details are never printed on the certificate.</p>
        </section>
      </div>
    </>
  );
}

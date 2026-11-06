import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { todayStr } from "@/lib/admin/dates";
import { certificateStatus, getEmployee } from "@/lib/admin/employees";
import { getSettings } from "@/lib/admin/settings";

export const metadata: Metadata = { title: "Edit employee" };

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [row, settings] = await Promise.all([getEmployee(id), getSettings()]);
  if (!row) notFound();
  return (
    <>
      <PageTitle title={`Edit ${row.fullName}`} />
      <EmployeeForm employee={{ ...row, hasPhoto: Boolean(row.employeePhoto), certificateStatus: certificateStatus(row) }} signatory={row.authorizedSignature?.name ?? settings.signatoryName} today={todayStr()} />
    </>
  );
}

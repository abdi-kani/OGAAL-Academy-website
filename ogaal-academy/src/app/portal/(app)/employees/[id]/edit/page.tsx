import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EmployeeForm } from "@/components/portal/EmployeeForm";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { todayStr } from "@/lib/portal/dates";
import { companyScope, getEmployee } from "@/lib/portal/employees";
import { can } from "@/lib/portal/permissions";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Edit employee" };

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("employees.edit");
  const { id } = await params;
  const row = /^\d+$/.test(id) ? await getEmployee(user, Number(id)) : null;
  if (!row) notFound();
  if (row.certificate_number && !can(user.role, "employees.editIssued")) redirect(`/portal/employees/${row.id}`);
  const settings = await getSettings();
  return (
    <>
      <PageTitle title={`Edit ${row.full_name}`} />
      <EmployeeForm
        employee={{
          id: row.id,
          full_name: row.full_name,
          company_name: row.company_name,
          employee_id: row.employee_id,
          phone_number: row.phone_number,
          blood_group: row.blood_group,
          date_of_birth: row.date_of_birth,
          job_position: row.job_position,
          training_date: row.training_date,
          has_photo: Boolean(row.employee_photo),
          certificate_number: row.certificate_number,
          certificate_issue_date: row.certificate_issue_date,
          certificate_expiry_date: row.certificate_expiry_date,
          certificate_status: row.certificate_status,
          authorized_signatory: row.authorized_signatory,
        }}
        assignedCompany={companyScope(user)}
        canAssess={false}
        questions={[]}
        signatory={settings.signatory_name}
        today={todayStr()}
      />
    </>
  );
}

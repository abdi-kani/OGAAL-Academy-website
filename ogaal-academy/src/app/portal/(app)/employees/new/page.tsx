import type { Metadata } from "next";
import { EmployeeForm } from "@/components/portal/EmployeeForm";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { todayStr } from "@/lib/portal/dates";
import { companyScope } from "@/lib/portal/employees";
import { can } from "@/lib/portal/permissions";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Register employee" };

export default async function NewEmployeePage() {
  const user = await requirePage("employees.create");
  const settings = await getSettings();
  return (
    <>
      <PageTitle title="Register employee" />
      <EmployeeForm assignedCompany={companyScope(user)} canAssess={can(user.role, "assessments.manage")} questions={settings.assessment_questions} signatory={settings.signatory_name} today={todayStr()} />
    </>
  );
}

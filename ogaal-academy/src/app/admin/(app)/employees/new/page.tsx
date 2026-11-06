import type { Metadata } from "next";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { todayStr } from "@/lib/admin/dates";
import { getSettings } from "@/lib/admin/settings";

export const metadata: Metadata = { title: "Register employee" };

export default async function NewEmployeePage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <>
      <PageTitle title="Register New Employee" />
      <EmployeeForm signatory={settings.signatoryName} today={todayStr()} />
    </>
  );
}

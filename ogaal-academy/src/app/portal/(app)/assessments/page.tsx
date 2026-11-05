import type { Metadata } from "next";
import { EmployeeTable } from "@/components/portal/EmployeeTable";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { parseFilters } from "@/lib/portal/employees";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Training & Assessment" };

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePage("employees.view");
  const filters = parseFilters(await searchParams, { result: "Unapproved", sort: "training_date", dir: "desc" });
  const { expiring_soon_days: days } = await getSettings();
  return (
    <>
      <PageTitle title="Training & Assessment" intro="Employees awaiting an approved assessment are shown first. Use Actions to record a result. This records an authorised assessor's decision: the system does not assess or diagnose anyone." />
      <EmployeeTable user={user} filters={filters} path="/portal/assessments" expiringSoonDays={days} />
    </>
  );
}

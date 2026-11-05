import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { EmployeeTable } from "@/components/portal/EmployeeTable";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { parseFilters } from "@/lib/portal/employees";
import { can } from "@/lib/portal/permissions";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePage("employees.view");
  const filters = parseFilters(await searchParams);
  const { expiring_soon_days: days } = await getSettings();
  return (
    <>
      <PageTitle title="Employees" intro="Search, filter and manage employee records.">
        {can(user.role, "employees.create") && (
          <Link href="/portal/employees/new" className="btn btn-primary">
            <UserPlus size={16} aria-hidden="true" /> Register employee
          </Link>
        )}
      </PageTitle>
      <EmployeeTable user={user} filters={filters} path="/portal/employees" expiringSoonDays={days} showExport />
    </>
  );
}

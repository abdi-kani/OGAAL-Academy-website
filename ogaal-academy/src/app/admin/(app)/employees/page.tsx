import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { EmployeeTable } from "@/components/admin/EmployeeTable";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { parseFilters } from "@/lib/admin/employees";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; focus?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  return (
    <>
      <PageTitle title="Employees">
        <Link href="/admin/employees/new" className="btn btn-primary"><UserPlus size={17} aria-hidden="true" /> Register Employee</Link>
      </PageTitle>
      <EmployeeTable filters={parseFilters(params)} focusSearch={params.focus === "search"} />
    </>
  );
}

import type { Metadata } from "next";
import { EmployeeTable } from "@/components/portal/EmployeeTable";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { query } from "@/lib/portal/db";
import { buildWhere, parseFilters } from "@/lib/portal/employees";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePage("reports.view");
  const filters = parseFilters(await searchParams, { sort: "full_name", dir: "asc" });
  const { expiring_soon_days: days } = await getSettings();
  const { sql, params } = buildWhere(user, filters, days);
  const byCompany = await query<{ company_name: string; employees: number; active: number; expired: number; revoked: number; passed: number; failed: number; pending: number }>(
    `SELECT e.company_name, COUNT(*) AS employees, SUM(e.certificate_status = 'Active') AS active, SUM(e.certificate_status = 'Expired') AS expired, SUM(e.certificate_status = 'Revoked') AS revoked,
       SUM(e.assessment_result = 'Passed') AS passed, SUM(e.assessment_result = 'Failed') AS failed, SUM(e.assessment_result = 'Pending') AS pending
     FROM employee_certificates e ${sql} GROUP BY e.company_name ORDER BY employees DESC, e.company_name LIMIT 20`,
    params,
  );
  return (
    <>
      <PageTitle title="Reports" intro="Filter the records, then export exactly what is shown to Excel or PDF. Exports never include date of birth, blood group or assessment notes." />
      <EmployeeTable user={user} filters={filters} path="/portal/reports" expiringSoonDays={days} showExport />
      <section className="panel mt-5">
        <h2 className="p-4">Summary by company</h2>
        <div className="overflow-x-auto">
          <table className="portal-table">
            <thead>
              <tr>
                {["Company", "Employees", "Active", "Expired", "Revoked", "Passed", "Failed", "Pending"].map((h) => <th key={h} scope="col">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {byCompany.map((r) => (
                <tr key={r.company_name}>
                  <td className="font-semibold text-navy">{r.company_name}</td>
                  <td>{Number(r.employees)}</td>
                  <td>{Number(r.active)}</td>
                  <td>{Number(r.expired)}</td>
                  <td>{Number(r.revoked)}</td>
                  <td>{Number(r.passed)}</td>
                  <td>{Number(r.failed)}</td>
                  <td>{Number(r.pending)}</td>
                </tr>
              ))}
              {byCompany.length === 0 && <tr><td colSpan={8} className="py-8 text-center">No records match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

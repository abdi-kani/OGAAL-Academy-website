import Link from "next/link";
import { formatDateShort } from "@/lib/admin/dates";
import { certificateStatus, issueBlocker, listEmployees, type Filters } from "@/lib/admin/employees";
import { RowActions } from "./RowActions";
import { Pagination, StatusBadge } from "./ui";

const COLUMNS = ["Certificate Number", "Photo", "Full Name", "Company", "Employee ID", "Phone", "Job Position", "Training Date", "Issue Date", "Expiry Date", "Status", "Actions"];
const STATUS_OPTIONS: [string, string][] = [["", "All"], ["Active", "Active"], ["ExpiringSoon", "Expiring Soon"], ["Expired", "Expired"], ["NotIssued", "Not issued"], ["Ready", "Ready for certificate"]];

function href(f: Filters, page: number) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.status) params.set("status", f.status);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/admin/employees?${s}` : "/admin/employees";
}

export async function EmployeeTable({ filters, focusSearch }: { filters: Filters; focusSearch?: boolean }) {
  const { rows, total, pageSize } = await listEmployees(filters);
  return (
    <div className="panel">
      <form method="get" action="/admin/employees" className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_14rem_auto]">
        <div>
          <label htmlFor="flt-q" className="admin-label">Search</label>
          <input id="flt-q" name="q" type="search" autoFocus={focusSearch} defaultValue={filters.q} placeholder="Name, Employee ID, certificate number, company, phone" className="admin-input" />
        </div>
        <div>
          <label htmlFor="flt-status" className="admin-label">Certificate status</label>
          <select id="flt-status" name="status" defaultValue={filters.status} className="admin-input">
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn btn-primary">Apply</button>
          <Link href="/admin/employees" className="btn btn-outline">Clear</Link>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className={c === "Actions" ? "pinned-col" : undefined}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap">{r.certificateNumber ?? "—"}</td>
                <td>
                  {r.employeePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/admin/employees/${r.id}/photo`} alt="" loading="lazy" className="h-10 w-8 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-8 rounded bg-light" aria-hidden="true" />
                  )}
                </td>
                <td className="min-w-40 font-semibold text-navy">
                  <Link href={`/admin/employees/${r.id}`} className="hover:text-blue">{r.fullName}</Link>
                </td>
                <td className="min-w-36">{r.companyName}</td>
                <td className="whitespace-nowrap">{r.employeeId}</td>
                <td className="whitespace-nowrap">{r.phoneNumber}</td>
                <td className="min-w-32">{r.jobPosition}</td>
                <td className="whitespace-nowrap">{formatDateShort(r.trainingDate)}</td>
                <td className="whitespace-nowrap">{formatDateShort(r.certificateIssueDate)}</td>
                <td className="whitespace-nowrap">{formatDateShort(r.certificateExpiryDate)}</td>
                <td><StatusBadge status={certificateStatus(r)} /></td>
                <td className="pinned-col">
                  <RowActions employee={{ id: r.id, fullName: r.fullName, employeeId: r.employeeId, certificateNumber: r.certificateNumber, canIssue: !issueBlocker(r) }} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="py-10 text-center">No employees match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={filters.page} pageSize={pageSize} total={total} href={(page) => href(filters, page)} />
    </div>
  );
}

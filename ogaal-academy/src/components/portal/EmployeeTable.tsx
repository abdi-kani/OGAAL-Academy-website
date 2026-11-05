import Link from "next/link";
import { ArrowDown, ArrowUp, FileSpreadsheet, FileText } from "lucide-react";
import type { PortalUser } from "@/lib/portal/auth";
import { formatDateShort, todayStr } from "@/lib/portal/dates";
import { filterOptions, listEmployees, type EmployeeFilters } from "@/lib/portal/employees";
import { ASSESSMENT_RESULTS, can } from "@/lib/portal/permissions";
import { RowActions, type RowPermissions } from "./RowActions";
import { Pagination, ResultBadge, StatusBadge } from "./ui";

export function rowPermissions(user: PortalUser): RowPermissions {
  return {
    edit: can(user.role, "employees.edit"),
    editIssued: can(user.role, "employees.editIssued"),
    assess: can(user.role, "assessments.manage"),
    certificates: can(user.role, "certificates.manage"),
    remove: can(user.role, "employees.delete"),
    renewRevoked: user.role === "Super Admin",
  };
}

const COLUMNS: { key?: string; label: string }[] = [
  { label: "Photo" },
  { key: "full_name", label: "Full Name" },
  { key: "company", label: "Company" },
  { key: "employee_id", label: "Employee ID" },
  { label: "Phone" },
  { key: "position", label: "Job Position" },
  { key: "training_date", label: "Training Date" },
  { key: "certificate_number", label: "Certificate No." },
  { key: "issue_date", label: "Issue Date" },
  { key: "expiry_date", label: "Expiry Date" },
  { key: "result", label: "Assessment" },
  { key: "status", label: "Status" },
  { label: "Actions" },
];

function query(path: string, f: EmployeeFilters, changes: Record<string, string | number>) {
  const values: Record<string, string | number> = {
    q: f.q, company: f.company, position: f.position, status: f.status, result: f.result, registeredBy: f.registeredBy,
    dateField: f.from || f.to ? f.dateField : "", from: f.from, to: f.to, sort: f.sort, dir: f.dir, page: f.page, ...changes,
  };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) if (v && !(k === "page" && v === 1)) params.set(k, String(v));
  const s = params.toString();
  return s ? `${path}?${s}` : path;
}

export async function EmployeeTable({
  user,
  filters,
  path,
  expiringSoonDays,
  statusOptions = [["", "All statuses"], ["Active", "Active"], ["ExpiringSoon", "Expiring soon"], ["Expired", "Expired"], ["Revoked", "Revoked"], ["None", "Not issued"]],
  resultOptions = [["", "All results"], ...ASSESSMENT_RESULTS.map((r) => [r, r] as [string, string]), ["Unapproved", "Awaiting approval"]],
  showExport,
}: {
  user: PortalUser;
  filters: EmployeeFilters;
  path: string;
  expiringSoonDays: number;
  statusOptions?: [string, string][];
  resultOptions?: [string, string][];
  showExport?: boolean;
}) {
  const [{ rows, total }, options] = await Promise.all([listEmployees(user, filters, expiringSoonDays), filterOptions(user)]);
  const perms = rowPermissions(user);
  const today = todayStr();
  const exportable = showExport && can(user.role, "reports.view");
  const exportHref = (format: string) => query("/api/portal/reports/export", filters, { format, page: 1 });

  return (
    <div className="panel">
      <form method="get" action={path} className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor="flt-q" className="portal-label">Search</label>
          <input id="flt-q" name="q" type="search" defaultValue={filters.q} placeholder="Name, ID, company, certificate, phone" className="portal-input" />
        </div>
        <FilterSelect label="Company" name="company" value={filters.company} options={[["", "All companies"], ...options.companies.map((c) => [c, c] as [string, string])]} />
        <FilterSelect label="Job position" name="position" value={filters.position} options={[["", "All positions"], ...options.positions.map((c) => [c, c] as [string, string])]} />
        <FilterSelect label="Certificate status" name="status" value={filters.status} options={statusOptions} />
        <FilterSelect label="Assessment" name="result" value={filters.result} options={resultOptions} />
        {options.registrars.length > 0 && (
          <FilterSelect label="Registered by" name="registeredBy" value={filters.registeredBy} options={[["", "Anyone"], ...options.registrars.map((r) => [String(r.id), r.full_name] as [string, string])]} />
        )}
        <FilterSelect label="Date applies to" name="dateField" value={filters.dateField} options={[["training", "Training date"], ["issue", "Issue date"], ["expiry", "Expiry date"], ["registered", "Registration date"]]} />
        <div>
          <label htmlFor="flt-from" className="portal-label">From</label>
          <input id="flt-from" name="from" type="date" defaultValue={filters.from} className="portal-input" />
        </div>
        <div>
          <label htmlFor="flt-to" className="portal-label">To</label>
          <input id="flt-to" name="to" type="date" defaultValue={filters.to} className="portal-input" />
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
          <button type="submit" className="btn btn-primary">Apply</button>
          <Link href={path} className="btn btn-outline">Clear</Link>
          {exportable && (
            <>
              <a href={exportHref("xlsx")} className="btn btn-outline"><FileSpreadsheet size={16} aria-hidden="true" /> Excel</a>
              <a href={exportHref("pdf")} className="btn btn-outline"><FileText size={16} aria-hidden="true" /> PDF</a>
            </>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="portal-table">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const on = c.key === filters.sort;
                return (
                  <th key={c.label} scope="col" className={c.label === "Actions" ? "pinned-col" : undefined} aria-sort={on ? (filters.dir === "asc" ? "ascending" : "descending") : undefined}>
                    {c.key ? (
                      <Link href={query(path, filters, { sort: c.key, dir: on && filters.dir === "asc" ? "desc" : "asc", page: 1 })} className="inline-flex items-center gap-1 hover:text-blue">
                        {c.label}
                        {on && (filters.dir === "asc" ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />)}
                      </Link>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.employee_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/portal/employees/${r.id}/photo`} alt="" loading="lazy" className="h-10 w-8 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-8 rounded bg-light" aria-hidden="true" />
                  )}
                </td>
                <td className="min-w-40 font-semibold text-navy">
                  <Link href={`/portal/employees/${r.id}`} className="hover:text-blue">{r.full_name}</Link>
                </td>
                <td className="min-w-36">{r.company_name}</td>
                <td className="whitespace-nowrap">{r.employee_id}</td>
                <td className="whitespace-nowrap">{r.phone_number}</td>
                <td className="min-w-32">{r.job_position}</td>
                <td className="whitespace-nowrap">{formatDateShort(r.training_date)}</td>
                <td className="whitespace-nowrap">{r.certificate_number ?? "—"}</td>
                <td className="whitespace-nowrap">{formatDateShort(r.certificate_issue_date)}</td>
                <td className="whitespace-nowrap">{formatDateShort(r.certificate_expiry_date)}</td>
                <td><ResultBadge result={r.assessment_result} approved={Boolean(r.assessment_approved_at)} /></td>
                <td><StatusBadge status={r.certificate_status} /></td>
                <td className="pinned-col"><RowActions employee={{ id: r.id, full_name: r.full_name, employee_id: r.employee_id, certificate_number: r.certificate_number, certificate_status: r.certificate_status }} perms={perms} today={today} /></td>
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
      <Pagination page={filters.page} pageSize={filters.pageSize} total={total} href={(page) => query(path, filters, { page })} />
    </div>
  );
}

function FilterSelect({ label, name, value, options }: { label: string; name: string; value: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={`flt-${name}`} className="portal-label">{label}</label>
      <select id={`flt-${name}`} name={name} defaultValue={value} className="portal-input">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

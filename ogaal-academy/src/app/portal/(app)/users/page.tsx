import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Pagination, PageTitle, StatusBadge } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { formatDateTime } from "@/lib/portal/dates";
import { query } from "@/lib/portal/db";
import { companyScope } from "@/lib/portal/employees";
import { ROLES, manageableRoles, type Role } from "@/lib/portal/permissions";

export const metadata: Metadata = { title: "Users Management" };

const PAGE_SIZE = 25;

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePage("users.manage");
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) ?? "";
  const role = ROLES.includes(sp.role as Role) ? sp.role! : "";
  const status = sp.status === "Active" || sp.status === "Inactive" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);

  // Admins see only the accounts they can manage; Super Admin accounts are not listed for them.
  const allowed = manageableRoles(user.role);
  const where = ["role IN (?)"];
  const params: unknown[] = [allowed];
  const scope = companyScope(user);
  if (scope) {
    where.push("assigned_company = ?");
    params.push(scope);
  }
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    where.push("(full_name LIKE ? OR username LIKE ? OR email LIKE ?)");
    params.push(like, like, like);
  }
  if (role) {
    where.push("role = ?");
    params.push(role);
  }
  if (status) {
    where.push("account_status = ?");
    params.push(status);
  }
  const sql = where.join(" AND ");
  const [{ total }] = await query<{ total: number }>(`SELECT COUNT(*) AS total FROM users WHERE ${sql}`, params);
  const rows = await query<{ id: number; full_name: string; username: string; email: string; role: string; assigned_company: string | null; account_status: string; last_login: string | null }>(
    `SELECT id, full_name, username, email, role, assigned_company, account_status, last_login FROM users WHERE ${sql} ORDER BY full_name LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  const href = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (role) s.set("role", role);
    if (status) s.set("status", status);
    if (p > 1) s.set("page", String(p));
    return `/portal/users${s.size ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageTitle title="Users Management" intro="Create accounts, assign roles, and activate or deactivate access.">
        <Link href="/portal/users/new" className="btn btn-primary"><UserPlus size={16} aria-hidden="true" /> Create user</Link>
      </PageTitle>
      <div className="panel">
        <form method="get" className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="u-q" className="portal-label">Search</label>
            <input id="u-q" name="q" type="search" defaultValue={q} placeholder="Name, username or email" className="portal-input" />
          </div>
          <div>
            <label htmlFor="u-role" className="portal-label">Role</label>
            <select id="u-role" name="role" defaultValue={role} className="portal-input">
              <option value="">All roles</option>
              {allowed.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="u-status" className="portal-label">Status</label>
            <select id="u-status" name="status" defaultValue={status} className="portal-input">
              <option value="">All statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn btn-primary">Apply</button>
            <Link href="/portal/users" className="btn btn-outline">Clear</Link>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="portal-table">
            <thead>
              <tr>
                {["Name", "Username", "Email", "Role", "Company", "Status", "Last login", "Actions"].map((h) => <th key={h} scope="col">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold whitespace-nowrap text-navy">{r.full_name}</td>
                  <td>{r.username}</td>
                  <td>{r.email}</td>
                  <td className="whitespace-nowrap">{r.role}</td>
                  <td>{r.assigned_company ?? "All"}</td>
                  <td><span className={`badge ${r.account_status === "Active" ? "badge-good" : "badge-none"}`}>{r.account_status}</span></td>
                  <td className="whitespace-nowrap">{formatDateTime(r.last_login)}</td>
                  <td className="whitespace-nowrap">
                    <Link href={`/portal/users/${r.id}`} className="btn btn-outline btn-sm">Edit</Link>{" "}
                    <Link href={`/portal/logs?user=${r.id}`} className="btn btn-outline btn-sm">Activity</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="py-10 text-center">No users match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={Number(total)} href={href} />
      </div>
    </>
  );
}

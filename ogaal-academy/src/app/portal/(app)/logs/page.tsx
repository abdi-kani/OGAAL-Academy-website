import type { Metadata } from "next";
import Link from "next/link";
import { Pagination, PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { formatDateTime, isValidDate } from "@/lib/portal/dates";
import { parseJson } from "@/lib/portal/db";
import { ACTION_LABELS, listAudit } from "@/lib/portal/logs";

export const metadata: Metadata = { title: "Activity Logs" };

const PAGE_SIZE = 50;

export default async function LogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await requirePage("logs.view");
  const sp = await searchParams;
  const action = sp.action && sp.action in ACTION_LABELS ? sp.action : "";
  const userId = sp.user && /^\d+$/.test(sp.user) ? sp.user : "";
  const from = sp.from && isValidDate(sp.from) ? sp.from : "";
  const to = sp.to && isValidDate(sp.to) ? sp.to : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listAudit(viewer, { action, userId, from, to, page, pageSize: PAGE_SIZE });
  const href = (p: number) => {
    const s = new URLSearchParams();
    if (action) s.set("action", action);
    if (userId) s.set("user", userId);
    if (from) s.set("from", from);
    if (to) s.set("to", to);
    if (p > 1) s.set("page", String(p));
    return `/portal/logs${s.size ? `?${s}` : ""}`;
  };
  return (
    <>
      <PageTitle title="Activity Logs" intro="Who did what, and when. Times are shown in the academy's time zone." />
      <div className="panel">
        <form method="get" className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          {userId && <input type="hidden" name="user" value={userId} />}
          <div>
            <label htmlFor="l-action" className="portal-label">Action</label>
            <select id="l-action" name="action" defaultValue={action} className="portal-input">
              <option value="">All actions</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="l-from" className="portal-label">From</label>
            <input id="l-from" type="date" name="from" defaultValue={from} className="portal-input" />
          </div>
          <div>
            <label htmlFor="l-to" className="portal-label">To</label>
            <input id="l-to" type="date" name="to" defaultValue={to} className="portal-input" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn btn-primary">Apply</button>
            <Link href="/portal/logs" className="btn btn-outline">Clear</Link>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="portal-table">
            <thead>
              <tr>
                {["Date and time", "User", "Action", "Record", "Details", "IP address"].map((h) => <th key={h} scope="col">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const details = parseJson<Record<string, unknown> | null>(r.details, null);
                return (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                    <td className="whitespace-nowrap">{r.user_name ?? "System"}</td>
                    <td className="font-medium whitespace-nowrap text-navy">{ACTION_LABELS[r.action] ?? r.action}</td>
                    <td className="whitespace-nowrap">
                      {r.record_type === "employee" && r.record_ref && r.action !== "employee.delete" ? (
                        <Link href={`/portal/employees/${r.record_ref}`} className="text-blue hover:underline">Employee #{r.record_ref}</Link>
                      ) : r.record_ref ? (
                        `${r.record_type} #${r.record_ref}`
                      ) : (
                        r.record_type ?? "—"
                      )}
                    </td>
                    <td className="text-xs">{details ? Object.entries(details).map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join("; ") : "—"}</td>
                    <td className="whitespace-nowrap">{r.ip_address ?? "—"}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} className="py-10 text-center">No activity matches these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={href} />
      </div>
    </>
  );
}

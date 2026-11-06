import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/ui";
import { ACTION_LABELS, listAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDateTime } from "@/lib/admin/dates";

export const metadata: Metadata = { title: "Activity log" };

export default async function ActivityPage() {
  await requireAdmin();
  const entries = (await listAudit()).slice(0, 200);
  return (
    <>
      <PageTitle title="Activity Log" intro="The 200 most recent administrator actions." />
      <div className="panel overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {["When", "Administrator", "Action", "Details", "IP address"].map((c) => <th key={c} scope="col">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap">{formatDateTime(e.at)}</td>
                <td>{e.username}</td>
                <td className="whitespace-nowrap">{ACTION_LABELS[e.action] ?? e.action}</td>
                <td className="min-w-48">{e.target ?? "—"}</td>
                <td className="whitespace-nowrap">{e.ip}</td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={5} className="py-10 text-center">Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

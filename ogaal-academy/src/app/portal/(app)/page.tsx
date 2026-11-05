import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Award, CalendarClock, CircleCheck, CircleX, ClipboardList, FileWarning, Hourglass, Users, UsersRound, type LucideIcon } from "lucide-react";
import { BarChart } from "@/components/portal/BarChart";
import { Notice, PageTitle, ResultBadge, StatusBadge } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { formatDateTime } from "@/lib/portal/dates";
import { listEmployees, parseFilters } from "@/lib/portal/employees";
import { ACTION_LABELS, listAudit, type AuditRow } from "@/lib/portal/logs";
import { can } from "@/lib/portal/permissions";
import { dashboardStats, dashboardTrends } from "@/lib/portal/reports";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value, icon: Icon, href }: { label: string; value: number; icon: LucideIcon; href?: string }) {
  const body = (
    <>
      <span className="icon-tile icon-tile-soft !h-10 !w-10">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-display text-2xl font-extrabold text-navy">{value.toLocaleString("en-GB")}</span>
        <span className="block text-xs font-medium">{label}</span>
      </span>
    </>
  );
  const cls = "panel flex items-center gap-3 p-4";
  return href ? <Link href={href} className={`${cls} transition-colors hover:border-blue`}>{body}</Link> : <div className={cls}>{body}</div>;
}

function Activity({ title, rows }: { title: string; rows: AuditRow[] }) {
  return (
    <section className="panel p-5">
      <h2>{title}</h2>
      {rows.length === 0 && <p className="mt-3 text-sm">Nothing yet.</p>}
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="py-2 text-sm">
            <p className="font-medium text-navy">{ACTION_LABELS[r.action] ?? r.action}</p>
            <p className="text-xs">
              {r.user_name ?? "System"} · {formatDateTime(r.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requirePage("dashboard.view");
  const canCerts = can(user.role, "certificates.manage");
  const canLogs = can(user.role, "logs.view");
  const [stats, trends, settings, recent, certActivity, userActivity] = await Promise.all([
    dashboardStats(user),
    dashboardTrends(user),
    getSettings(),
    listEmployees(user, parseFilters({}, { pageSize: 6 })),
    canLogs ? listAudit(user, { actionPrefix: "certificate.", pageSize: 6 }) : null,
    canLogs ? listAudit(user, { pageSize: 6 }) : null,
  ]);
  const certHref = (status: string) => (canCerts ? `/portal/certificates?status=${status}` : `/portal/employees?status=${status}`);
  const backupAgeHours = settings.backup_last_success_at ? (Date.now() - new Date(settings.backup_last_success_at).getTime()) / 3600000 : null;

  return (
    <>
      <PageTitle title="Dashboard" intro={`Welcome, ${user.full_name}.${user.role !== "Super Admin" && user.assigned_company ? ` Showing ${user.assigned_company}.` : ""}`} />

      {can(user.role, "settings.manage") && (
        <div className="mb-5 space-y-2">
          {(!settings.signature_path || !settings.stamp_path) && (
            <Notice>
              <AlertTriangle size={15} aria-hidden="true" className="mr-1 inline" />
              Certificates are printing without {!settings.signature_path && !settings.stamp_path ? "a signature or stamp" : !settings.stamp_path ? "a stamp" : "a signature"}. <Link href="/portal/settings" className="underline">Upload them in Settings</Link>.
            </Notice>
          )}
          {settings.backup_last_status === "failed" && (
            <Notice tone="bad">
              The last backup failed: {settings.backup_last_error}
            </Notice>
          )}
          {(backupAgeHours === null || backupAgeHours > 36) && settings.backup_last_status !== "failed" && (
            <Notice>
              {backupAgeHours === null ? "No backup has been recorded yet." : `The last successful backup was ${Math.floor(backupAgeHours)} hours ago.`} See the backup section of the README.
            </Notice>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Stat label="Registered employees" value={stats.employees} icon={UsersRound} href="/portal/employees" />
        <Stat label="Certificates issued" value={stats.issued} icon={Award} />
        <Stat label="Active certificates" value={stats.active} icon={CircleCheck} href={certHref("Active")} />
        <Stat label="Expired certificates" value={stats.expired} icon={FileWarning} href={certHref("Expired")} />
        <Stat label={`Expiring within ${stats.expiringSoonDays} days`} value={stats.expiringSoon} icon={CalendarClock} href={certHref("ExpiringSoon")} />
        <Stat label="Pending assessments" value={stats.pending} icon={Hourglass} href="/portal/assessments?result=Pending" />
        <Stat label="Passed assessments" value={stats.passed} icon={ClipboardList} href="/portal/assessments?result=Passed" />
        <Stat label="Failed assessments" value={stats.failed} icon={CircleX} href="/portal/assessments?result=Failed" />
        {can(user.role, "users.manage") && <Stat label="System users" value={stats.users} icon={Users} href="/portal/users" />}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <BarChart title="Employee registrations" points={trends.registrations} unit="registrations" />
        <BarChart title="Certificates issued" points={trends.issued} unit="certificates" />
        <BarChart title="Expiring in the next 12 months" points={trends.expiring} unit="certificates" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <section className="panel p-5">
          <h2>Recent registrations</h2>
          {recent.rows.length === 0 && <p className="mt-3 text-sm">No employees registered yet.</p>}
          <ul className="mt-3 divide-y divide-line">
            {recent.rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <Link href={`/portal/employees/${r.id}`} className="font-medium text-navy hover:text-blue">{r.full_name}</Link>
                <span className="flex gap-1">
                  <ResultBadge result={r.assessment_result} />
                  <StatusBadge status={r.certificate_status} />
                </span>
              </li>
            ))}
          </ul>
        </section>
        {certActivity && <Activity title="Recent certificate activity" rows={certActivity.rows} />}
        {userActivity && <Activity title="Recent user activity" rows={userActivity.rows} />}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Award, CalendarClock, CircleCheck, FileWarning, Search, UserPlus, UsersRound, type LucideIcon } from "lucide-react";
import { Notice, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/dates";
import { EXPIRING_SOON_DAYS, dashboardStats } from "@/lib/admin/employees";
import { getSettings } from "@/lib/admin/settings";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value, icon: Icon, href }: { label: string; value: number; icon: LucideIcon; href: string }) {
  return (
    <Link href={href} className="panel flex items-center gap-3 p-4 transition-colors hover:border-blue">
      <span className="icon-tile icon-tile-soft !h-10 !w-10">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-display text-2xl font-extrabold text-navy">{value.toLocaleString("en-GB")}</span>
        <span className="block text-xs font-medium">{label}</span>
      </span>
    </Link>
  );
}

const ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Register New Employee", href: "/admin/employees/new", icon: UserPlus },
  { label: "View All Employees", href: "/admin/employees", icon: UsersRound },
  { label: "Search Certificates", href: "/admin/employees?focus=search", icon: Search },
  { label: "Generate Certificate", href: "/admin/employees?status=Ready", icon: Award },
];

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [stats, settings] = await Promise.all([dashboardStats(), getSettings()]);
  return (
    <>
      <PageTitle title="Dashboard" intro={`Welcome, ${admin.username}.`} />
      {(!settings.signatureAsset || !settings.sealAsset) && (
        <div className="mb-5">
          <Notice>
            Certificates will print without {!settings.signatureAsset && !settings.sealAsset ? "a signature or seal" : !settings.sealAsset ? "a seal" : "a signature"}. <Link href="/admin/settings" className="underline">Upload them in Settings</Link>.
          </Notice>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Registered Employees" value={stats.employees} icon={UsersRound} href="/admin/employees" />
        <Stat label="Active Certificates" value={stats.active} icon={CircleCheck} href="/admin/employees?status=Active" />
        <Stat label="Expired Certificates" value={stats.expired} icon={FileWarning} href="/admin/employees?status=Expired" />
        <Stat label={`Certificates Expiring Soon (${EXPIRING_SOON_DAYS} days)`} value={stats.expiringSoon} icon={CalendarClock} href="/admin/employees?status=ExpiringSoon" />
      </div>
      <section className="panel mt-5 p-5">
        <h2>Quick actions</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="btn btn-outline justify-start">
              <a.icon size={17} aria-hidden="true" /> {a.label}
            </Link>
          ))}
        </div>
        {stats.ready > 0 && <p className="mt-3 text-sm">{stats.ready.toLocaleString("en-GB")} employee(s) are ready for a certificate.</p>}
      </section>
      <p className="mt-5 text-xs">Last automatic backup: {stats.lastBackupOn ? formatDate(stats.lastBackupOn) : "none yet"}. A backup is made with the first change of each day.</p>
    </>
  );
}

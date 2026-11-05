"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Award, BarChart3, ClipboardCheck, FileClock, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, UserPlus, UserRound, Users, UsersRound, X, type LucideIcon } from "lucide-react";
import { can, type Permission, type Role } from "@/lib/portal/permissions";

const NAV: { label: string; href: string; icon: LucideIcon; permission: Permission }[] = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Employees", href: "/portal/employees", icon: UsersRound, permission: "employees.view" },
  { label: "Register Employee", href: "/portal/employees/new", icon: UserPlus, permission: "employees.create" },
  { label: "Training & Assessment", href: "/portal/assessments", icon: ClipboardCheck, permission: "employees.view" },
  { label: "Certificates", href: "/portal/certificates", icon: Award, permission: "certificates.manage" },
  { label: "Certificate Verification", href: "/portal/verification", icon: ShieldCheck, permission: "verification.use" },
  { label: "Users Management", href: "/portal/users", icon: Users, permission: "users.manage" },
  { label: "Reports", href: "/portal/reports", icon: BarChart3, permission: "reports.view" },
  { label: "Activity Logs", href: "/portal/logs", icon: FileClock, permission: "logs.view" },
  { label: "Settings", href: "/portal/settings", icon: Settings, permission: "settings.manage" },
];

export function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => can(role, n.permission));
  // The longest matching link is the active one, so Register Employee doesn't also light up Employees.
  const active = items.filter((n) => pathname === n.href || (n.href !== "/portal" && pathname.startsWith(`${n.href}/`))).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  async function logout() {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.replace("/portal/login");
    router.refresh();
  }

  const linkClass = (on: boolean) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${on ? "bg-blue text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`;

  return (
    <>
      <div className="flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <span className="font-display font-bold">OGAAL Portal</span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10">
          <Menu size={22} aria-hidden="true" />
        </button>
      </div>
      {open && <div className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ogaal-mark.png" alt="" className="h-10 w-auto rounded bg-white p-1" />
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-white">OGAAL Academy</p>
            <p className="text-xs text-white/60">Certificate portal</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-lg text-white hover:bg-white/10 lg:hidden">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Portal" className="flex-1 space-y-1 overflow-y-auto px-3">
          {items.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active === n.href ? "page" : undefined} className={linkClass(active === n.href)}>
              <n.icon size={18} aria-hidden="true" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <Link href="/portal/account" onClick={() => setOpen(false)} className={linkClass(pathname === "/portal/account")}>
            <UserRound size={18} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate">{name}</span>
              <span className="block text-xs font-normal opacity-70">{role}</span>
            </span>
          </Link>
          <button type="button" onClick={logout} className={`${linkClass(false)} w-full`}>
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

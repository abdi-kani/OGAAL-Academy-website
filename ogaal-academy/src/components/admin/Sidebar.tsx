"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileClock, LayoutDashboard, LogOut, Menu, Settings, UserPlus, UsersRound, X, type LucideIcon } from "lucide-react";

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: UsersRound },
  { label: "Register Employee", href: "/admin/employees/new", icon: UserPlus },
  { label: "Activity Log", href: "/admin/activity", icon: FileClock },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // The longest matching link is the active one, so Register Employee doesn't also light up Employees.
  const active = NAV.filter((n) => pathname === n.href || pathname.startsWith(`${n.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const linkClass = (on: boolean) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${on ? "bg-blue text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`;

  return (
    <>
      <div className="flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <span className="font-display font-bold">OGAAL Admin</span>
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
            <p className="text-xs text-white/60">Admin</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-lg text-white hover:bg-white/10 lg:hidden">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active === n.href ? "page" : undefined} className={linkClass(active === n.href)}>
              <n.icon size={18} aria-hidden="true" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <p className="truncate px-3 py-1 text-xs text-white/60">Signed in as {name}</p>
          <button type="button" onClick={logout} className={`${linkClass(false)} w-full`}>
            <LogOut size={18} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

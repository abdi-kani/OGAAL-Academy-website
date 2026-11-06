import type { Metadata } from "next";

// Sessions and settings are only known per request: nothing here may be prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | OGAAL Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-ui flex flex-1 flex-col bg-light">{children}</div>;
}

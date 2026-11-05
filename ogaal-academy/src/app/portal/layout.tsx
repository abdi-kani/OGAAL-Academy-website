import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s | OGAAL Portal" },
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal flex flex-1 flex-col bg-light">{children}</div>;
}

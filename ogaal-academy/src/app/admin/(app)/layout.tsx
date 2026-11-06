import { Sidebar } from "@/components/admin/Sidebar";
import { Notice } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { isStorageConfigured } from "@/lib/admin/github";

/** Pages and API routes each check the session themselves too. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar name={admin.username} />
      <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
        {isStorageConfigured() ? children : <Notice tone="bad">GitHub storage is not configured yet. See section 10 of the README.</Notice>}
      </main>
    </div>
  );
}

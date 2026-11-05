import { Sidebar } from "@/components/portal/Sidebar";
import { requirePage } from "@/lib/portal/auth";
import { sweepExpiredThrottled } from "@/lib/portal/certificates";

/** Signs the visitor in. Each page and API route still checks its own permission. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePage(undefined, { allowPasswordChangePending: true });
  await sweepExpiredThrottled();
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar role={user.role} name={user.full_name} />
      <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

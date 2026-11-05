import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/portal/AuthForms";
import { DetailList, Notice, PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { formatDateTime } from "@/lib/portal/dates";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requirePage(undefined, { allowPasswordChangePending: true });
  const required = Boolean(user.must_change_password);
  return (
    <>
      <PageTitle title="My account" />
      {required && <div className="mb-4"><Notice>Please replace your temporary password before continuing.</Notice></div>}
      <section className="panel mb-5 p-5">
        <DetailList
          items={[
            ["Name", user.full_name],
            ["Username", user.username],
            ["Email", user.email],
            ["Role", user.role],
            ["Company", user.assigned_company ?? "All companies"],
            ["Last login", formatDateTime(user.last_login)],
          ]}
        />
      </section>
      <section className="panel p-5">
        <h2 className="mb-4">Change password</h2>
        <ChangePasswordForm required={required} />
      </section>
    </>
  );
}

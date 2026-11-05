import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/portal/UserForm";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { formatDateTime } from "@/lib/portal/dates";
import { queryOne } from "@/lib/portal/db";
import { companyScope } from "@/lib/portal/employees";
import { manageableRoles, type Role } from "@/lib/portal/permissions";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("users.manage");
  const { id } = await params;
  const row = /^\d+$/.test(id)
    ? await queryOne<{ id: number; full_name: string; username: string; email: string; phone_number: string | null; profile_photo: string | null; role: Role; assigned_company: string | null; account_status: string; last_login: string | null }>(
        "SELECT id, full_name, username, email, phone_number, profile_photo, role, assigned_company, account_status, last_login FROM users WHERE id = ?",
        [id],
      )
    : null;
  const scope = companyScope(user);
  if (!row || !manageableRoles(user.role).includes(row.role) || (scope && row.assigned_company !== scope)) notFound();
  return (
    <>
      <PageTitle title={row.full_name} intro={`Last login: ${formatDateTime(row.last_login)}`}>
        <Link href={`/portal/logs?user=${row.id}`} className="btn btn-outline">View activity</Link>
      </PageTitle>
      <UserForm
        user={{ id: row.id, full_name: row.full_name, username: row.username, email: row.email, phone_number: row.phone_number, role: row.role, assigned_company: row.assigned_company, account_status: row.account_status, has_photo: Boolean(row.profile_photo) }}
        roles={manageableRoles(user.role)}
        lockedCompany={scope}
        isSelf={row.id === user.id}
      />
    </>
  );
}

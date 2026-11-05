import type { Metadata } from "next";
import { UserForm } from "@/components/portal/UserForm";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { companyScope } from "@/lib/portal/employees";
import { manageableRoles } from "@/lib/portal/permissions";

export const metadata: Metadata = { title: "Create user" };

export default async function NewUserPage() {
  const user = await requirePage("users.manage");
  return (
    <>
      <PageTitle title="Create user" intro="A temporary password is generated for the new account. The user must change it at first sign-in." />
      <UserForm roles={manageableRoles(user.role)} lockedCompany={companyScope(user)} />
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/portal/AuthForms";
import { Notice } from "@/components/portal/ui";
import { getCurrentUser } from "@/lib/portal/auth";
import { isDbConfigured } from "@/lib/portal/db";
import { homePath } from "@/lib/portal/permissions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePath(user.role));
  return (
    <>
      <h1 className="mb-1 text-center">Sign in</h1>
      <p className="mb-5 text-center text-sm">Certificate management portal</p>
      {isDbConfigured() ? <LoginForm /> : <Notice tone="bad">The portal database is not configured yet. See the README.</Notice>}
    </>
  );
}

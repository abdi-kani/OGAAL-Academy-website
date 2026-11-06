import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Notice } from "@/components/admin/ui";
import { getAdmin, isAuthConfigured } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Admin login" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin/dashboard");
  return (
    <>
      <h1 className="mb-1 text-center">Admin login</h1>
      <p className="mb-5 text-center text-sm">Certificate management</p>
      {isAuthConfigured() ? <LoginForm /> : <Notice tone="bad">The admin system is not configured yet. See section 10 of the README.</Notice>}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/portal/AuthForms";
import { Notice } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Set a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="mb-5 text-center">Set a new password</h1>
      {typeof token === "string" && token ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-4">
          <Notice tone="bad">This reset link is incomplete.</Notice>
          <Link href="/portal/forgot-password" className="btn btn-outline w-full">Request a new link</Link>
        </div>
      )}
    </>
  );
}

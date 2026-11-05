import type { Metadata } from "next";
import { ForgotForm } from "@/components/portal/AuthForms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-center">Forgot password</h1>
      <p className="mb-5 text-center text-sm">We&apos;ll email you a link to set a new one.</p>
      <ForgotForm />
    </>
  );
}

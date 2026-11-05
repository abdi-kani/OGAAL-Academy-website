import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHeader } from "@/components/PageHeader";
import { VerificationCard } from "@/components/portal/VerificationCard";
import { verifyCertificate } from "@/lib/portal/certificates";
import { isDbConfigured } from "@/lib/portal/db";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "Certificate Verification", robots: { index: false, follow: false } };

/** Where certificate QR codes land. The link carries a random token, not the sequential certificate number. */
export default async function VerifyTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const h = await headers();
  const ip = clientIpFrom(h);
  const allowed = rateLimit(`verify:${ip}`, 30, 10 * 60 * 1000).ok;
  const result = allowed && isDbConfigured() ? await verifyCertificate({ token }) : null;
  return (
    <>
      <PageHeader crumb="Certificate Verification" eyebrow="Certification" title="Certificate Verification" icon="bulletCheck" />
      <section className="py-12 lg:py-16">
        <div className="container-x max-w-2xl">
          {result ? (
            <VerificationCard result={result} />
          ) : (
            <p role="alert" className="rounded-xl bg-amber-50 p-4 font-medium text-amber-900">
              {allowed ? "Certificate verification is not available yet. Please contact the academy." : "Too many checks from this connection. Please try again in a few minutes."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

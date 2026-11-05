import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHeader } from "@/components/PageHeader";
import { VerificationCard } from "@/components/portal/VerificationCard";
import { verifyCertificate, type VerificationResult } from "@/lib/portal/certificates";
import { isDbConfigured } from "@/lib/portal/db";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Verify a Certificate",
  description: "Check whether an OGAAL Firearms Safety Training Certificate is genuine and currently valid.",
  path: "/verify",
});

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ number?: string | string[] }> }) {
  const { number } = await searchParams;
  const value = typeof number === "string" ? number.trim().slice(0, 40) : "";
  let result: VerificationResult | null = null;
  let problem: string | null = null;
  if (value) {
    const h = await headers();
    const ip = clientIpFrom(h);
    // Numbers run in sequence, so the limit is what stops someone stepping through every certificate.
    if (!isDbConfigured()) problem = "Certificate verification is not available yet. Please contact the academy.";
    else if (!rateLimit(`verify:${ip}`, 30, 10 * 60 * 1000).ok) problem = "Too many checks from this connection. Please try again in a few minutes.";
    else {
      try {
        result = await verifyCertificate({ number: value });
      } catch (err) {
        console.error("Verification failed:", err);
        problem = "Verification is temporarily unavailable. Please try again shortly.";
      }
    }
  }
  return (
    <>
      <PageHeader crumb="Verify a Certificate" eyebrow="Certification" title="Verify a Certificate" intro={<p>Enter the certificate number printed on the certificate, or scan its QR code.</p>} icon="bulletCheck" />
      <section className="py-12 lg:py-16">
        <div className="container-x max-w-2xl">
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="number" className="mb-1.5 block font-display text-sm font-bold text-navy">Certificate number</label>
              <input id="number" name="number" required defaultValue={value} placeholder="CERT-2026-00001" autoComplete="off" className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-navy" />
            </div>
            <button type="submit" className="btn btn-primary">Verify</button>
          </form>
          {problem && <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 font-medium text-amber-900">{problem}</p>}
          {result && <div className="mt-6"><VerificationCard result={result} /></div>}
        </div>
      </section>
    </>
  );
}

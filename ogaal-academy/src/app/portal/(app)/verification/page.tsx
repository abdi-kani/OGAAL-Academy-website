import type { Metadata } from "next";
import { VerificationCard } from "@/components/portal/VerificationCard";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { verifyCertificate } from "@/lib/portal/certificates";

export const metadata: Metadata = { title: "Certificate Verification" };

export default async function VerificationPage({ searchParams }: { searchParams: Promise<{ number?: string | string[] }> }) {
  await requirePage("verification.use");
  const { number } = await searchParams;
  const value = typeof number === "string" ? number.trim().slice(0, 40) : "";
  const result = value ? await verifyCertificate({ number: value }) : null;
  return (
    <>
      <PageTitle title="Certificate Verification" intro="Search by certificate number." />
      <form method="get" className="panel mb-5 flex max-w-xl flex-wrap items-end gap-3 p-5">
        <div className="min-w-48 flex-1">
          <label htmlFor="number" className="portal-label">Certificate number</label>
          <input id="number" name="number" required defaultValue={value} placeholder="CERT-2026-00001" className="portal-input" />
        </div>
        <button type="submit" className="btn btn-primary">Verify</button>
      </form>
      {result && <div className="max-w-xl"><VerificationCard result={result} /></div>}
    </>
  );
}

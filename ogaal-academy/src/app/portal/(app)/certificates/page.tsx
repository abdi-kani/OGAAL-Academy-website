import type { Metadata } from "next";
import { EmployeeTable } from "@/components/portal/EmployeeTable";
import { PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { parseFilters } from "@/lib/portal/employees";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePage("certificates.manage");
  const filters = parseFilters(await searchParams, { status: "Issued", sort: "issue_date", dir: "desc" });
  const { expiring_soon_days: days } = await getSettings();
  return (
    <>
      <PageTitle title="Certificates" intro="Download, print, renew or revoke issued certificates." />
      <EmployeeTable
        user={user}
        filters={filters}
        path="/portal/certificates"
        expiringSoonDays={days}
        showExport
        statusOptions={[["Issued", "All issued"], ["Active", "Active"], ["ExpiringSoon", `Expiring within ${days} days`], ["Expired", "Expired"], ["Revoked", "Revoked"]]}
      />
    </>
  );
}

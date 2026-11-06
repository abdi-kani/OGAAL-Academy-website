import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getSettings } from "@/lib/admin/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <>
      <PageTitle title="Settings" />
      <SettingsForm values={{ signatoryName: s.signatoryName, signatoryTitle: s.signatoryTitle, trainingTitle: s.trainingTitle, hasSignature: Boolean(s.signatureAsset), hasSeal: Boolean(s.sealAsset) }} />
    </>
  );
}

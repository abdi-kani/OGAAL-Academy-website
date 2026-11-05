import type { Metadata } from "next";
import { SettingsForm } from "@/components/portal/SettingsForm";
import { DetailList, PageTitle } from "@/components/portal/ui";
import { requirePage } from "@/lib/portal/auth";
import { getSettings } from "@/lib/portal/settings";

export const metadata: Metadata = { title: "Settings" };

const when = (iso: string) => (iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: process.env.APP_TIMEZONE || "Africa/Mogadishu" }).format(new Date(iso)) : "Never");

export default async function SettingsPage() {
  await requirePage("settings.manage");
  const s = await getSettings();
  return (
    <>
      <PageTitle title="Settings" intro="Available to Super Admins only." />
      <SettingsForm
        values={{
          signatory_name: s.signatory_name,
          expiring_soon_days: s.expiring_soon_days,
          show_photo_on_certificate: s.show_photo_on_certificate,
          show_assessment_on_certificate: s.show_assessment_on_certificate,
          assessment_questions: s.assessment_questions,
          has_signature: Boolean(s.signature_path),
          has_stamp: Boolean(s.stamp_path),
          has_logo: Boolean(s.logo_path),
        }}
      />
      <section className="panel mt-5 p-5">
        <h2 className="mb-4">Backups</h2>
        <DetailList
          items={[
            ["Automatic daily backup", process.env.BACKUP_ENABLED === "true" ? "On" : "Off (set BACKUP_ENABLED=true)"],
            ["Last result", s.backup_last_status === "ok" ? "Succeeded" : s.backup_last_status === "failed" ? `Failed: ${s.backup_last_error}` : "No backup recorded"],
            ["Last successful backup", when(s.backup_last_success_at)],
            ["Last attempt", when(s.backup_last_attempt_at)],
          ]}
        />
      </section>
    </>
  );
}

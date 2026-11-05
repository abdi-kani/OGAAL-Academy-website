import "server-only";
import { parseJson, query, run } from "./db";

export type PortalSettings = {
  signatory_name: string;
  signature_path: string;
  stamp_path: string;
  logo_path: string;
  expiring_soon_days: number;
  show_photo_on_certificate: boolean;
  show_assessment_on_certificate: boolean;
  assessment_questions: string[];
  backup_last_success_at: string;
  backup_last_attempt_at: string;
  backup_last_status: string;
  backup_last_error: string;
};

// Placeholders the academy should replace in Settings with its approved assessment questions.
const DEFAULT_QUESTIONS = [
  "Was the assessment carried out in person by the authorised assessor?",
  "Was the purpose of the assessment explained to the trainee?",
  "Were all parts of the assessment process completed?",
];

export async function getSettings(): Promise<PortalSettings> {
  const rows = await query<{ setting_key: string; setting_value: string | null }>("SELECT setting_key, setting_value FROM system_settings WHERE setting_key NOT LIKE 'cert\\_seq\\_%'");
  const v = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value ?? ""]));
  const flag = (key: string) => (key in v ? v[key] === "1" : true);
  const days = Number(v.expiring_soon_days);
  return {
    signatory_name: v.signatory_name ?? "",
    signature_path: v.signature_path ?? "",
    stamp_path: v.stamp_path ?? "",
    logo_path: v.logo_path ?? "",
    expiring_soon_days: days > 0 ? days : 30,
    show_photo_on_certificate: flag("show_photo_on_certificate"),
    show_assessment_on_certificate: flag("show_assessment_on_certificate"),
    assessment_questions: "assessment_questions" in v ? parseJson<string[]>(v.assessment_questions, []) : DEFAULT_QUESTIONS,
    backup_last_success_at: v.backup_last_success_at ?? "",
    backup_last_attempt_at: v.backup_last_attempt_at ?? "",
    backup_last_status: v.backup_last_status ?? "",
    backup_last_error: v.backup_last_error ?? "",
  };
}

export async function setSetting(key: string, value: string): Promise<void> {
  await run("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [key, value]);
}

/**
 * Atomic per-year counter, committed independently of any transaction: a number is never handed out
 * twice, even if the certificate that took it later rolls back or the record is deleted.
 */
export async function nextSequence(year: string): Promise<number> {
  const res = await run(
    "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, '1') ON DUPLICATE KEY UPDATE setting_value = LAST_INSERT_ID(CAST(setting_value AS UNSIGNED) + 1)",
    [`cert_seq_${year}`],
  );
  // insertId is 0 only when this call created the row, which makes this number 1.
  return res.insertId ? Number(res.insertId) : 1;
}

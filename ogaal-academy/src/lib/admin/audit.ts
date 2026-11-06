import "server-only";
import { encryptedJsonFile } from "./store";

export type AuditEntry = { at: string; username: string; action: string; target?: string; ip: string };
type AuditFile = { entries: AuditEntry[] };

/** Every entry rewrites the file, so it keeps the most recent entries. Full history stays in the repository's commits. */
const MAX_ENTRIES = 2000;

const auditFile = encryptedJsonFile<AuditFile>("data/audit-log.json.enc", {
  kind: "audit",
  message: "Update audit log",
  empty: () => ({ entries: [] }),
});

export const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Logged in",
  "auth.logout": "Logged out",
  "employee.create": "Registered employee",
  "employee.update": "Edited employee",
  "employee.delete": "Deleted employee",
  "certificate.issue": "Issued certificate",
  "certificate.pdf": "Downloaded certificate PDF",
  "certificate.print": "Opened certificate to print",
  "settings.update": "Changed settings",
};

export const listAudit = async (): Promise<AuditEntry[]> => (await auditFile.read()).entries;

/** The action has already happened by now, so a failed log write is reported rather than shown as a failed action. */
export async function audit(username: string, action: string, ip: string, target?: string): Promise<void> {
  try {
    await auditFile.update((file) => {
      file.entries.unshift({ at: new Date().toISOString(), username, action, target, ip });
      file.entries.length = Math.min(file.entries.length, MAX_ENTRIES);
    });
  } catch (err) {
    console.error(`Audit write failed for ${action}:`, (err as Error).message);
  }
}

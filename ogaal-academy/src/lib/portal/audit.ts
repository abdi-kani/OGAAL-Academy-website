import "server-only";
import { run } from "./db";

/** Logs carry references and field names, not personal values such as names, phone numbers or remarks. */
export async function audit(entry: {
  userId: number | null;
  action: string;
  recordType?: string;
  recordRef?: string | number | null;
  details?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    await run("INSERT INTO audit_logs (user_id, action, record_type, record_ref, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)", [
      entry.userId,
      entry.action,
      entry.recordType ?? null,
      entry.recordRef === undefined || entry.recordRef === null ? null : String(entry.recordRef),
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ip?.slice(0, 64) ?? null,
    ]);
  } catch (err) {
    // A logging fault must not undo work that has already been committed.
    console.error("Audit log write failed:", (err as Error).message);
  }
}

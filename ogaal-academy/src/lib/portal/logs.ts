import "server-only";
import type { PortalUser } from "./auth";
import { query } from "./db";
import { addDays } from "./dates";
import { companyScope } from "./employees";

export type AuditRow = {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  record_type: string | null;
  record_ref: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
};

export type AuditFilters = { action?: string; actionPrefix?: string; userId?: string; from?: string; to?: string; page?: number; pageSize?: number };

/** A company-limited admin sees only the activity of users in the same company. */
export async function listAudit(viewer: PortalUser, f: AuditFilters): Promise<{ rows: AuditRow[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  const scope = companyScope(viewer);
  if (scope) {
    where.push("u.assigned_company = ?");
    params.push(scope);
  }
  if (f.action) {
    where.push("a.action = ?");
    params.push(f.action);
  }
  if (f.actionPrefix) {
    where.push("a.action LIKE ?");
    params.push(`${f.actionPrefix}%`);
  }
  if (f.userId) {
    where.push("a.user_id = ?");
    params.push(f.userId);
  }
  if (f.from) {
    where.push("a.created_at >= ?");
    params.push(f.from);
  }
  if (f.to) {
    where.push("a.created_at < ?");
    params.push(addDays(f.to, 1));
  }
  const sql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const pageSize = f.pageSize ?? 50;
  const [{ total }] = await query<{ total: number }>(`SELECT COUNT(*) AS total FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ${sql}`, params);
  const rows = await query<AuditRow>(
    `SELECT a.id, a.user_id, u.full_name AS user_name, a.action, a.record_type, a.record_ref, a.details, a.ip_address, a.created_at
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ${sql} ORDER BY a.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, ((f.page ?? 1) - 1) * pageSize],
  );
  return { rows, total: Number(total) };
}

export const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
  "auth.login_blocked": "Blocked sign-in (inactive account)",
  "auth.logout": "Signed out",
  "auth.password_reset_requested": "Requested password reset",
  "auth.password_reset": "Reset password by email link",
  "auth.password_changed": "Changed password",
  "user.create": "Created user",
  "user.update": "Updated user",
  "user.password_reset": "Reset a user's password",
  "employee.create": "Registered employee",
  "employee.update": "Updated employee",
  "employee.delete": "Deleted employee",
  "assessment.update": "Updated assessment",
  "assessment.approve": "Approved assessment",
  "certificate.issue": "Issued certificate",
  "certificate.regenerate": "Regenerated certificate PDF",
  "certificate.renew": "Renewed certificate",
  "certificate.revoke": "Revoked certificate",
  "certificate.expire": "Certificates expired automatically",
  "certificate.download": "Downloaded certificate PDF",
  "certificate.view": "Opened certificate PDF",
  "report.export": "Exported report",
  "settings.update": "Updated settings",
};

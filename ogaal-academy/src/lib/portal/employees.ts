import "server-only";
import type { PortalUser } from "./auth";
import { parseJson, query, queryOne } from "./db";
import { addDays, isValidDate, todayStr } from "./dates";
import { ASSESSMENT_RESULTS, BLOOD_GROUPS, CERTIFICATE_STATUSES, can } from "./permissions";

export type CertificateHistoryEntry = {
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: "Active" | "Expired" | "Revoked";
  pdf_path: string | null;
  verification_token: string;
  replaced_at: string;
  replaced_by: number;
};

export type EmployeeRow = {
  id: number;
  full_name: string;
  company_name: string;
  employee_id: string;
  phone_number: string;
  blood_group: (typeof BLOOD_GROUPS)[number];
  employee_photo: string | null;
  date_of_birth: string;
  job_position: string;
  training_date: string | null;
  certificate_number: string | null;
  certificate_issue_date: string | null;
  certificate_expiry_date: string | null;
  certificate_validity: string;
  certificate_status: (typeof CERTIFICATE_STATUSES)[number] | null;
  certificate_revocation_reason: string | null;
  certificate_pdf_path: string | null;
  verification_token: string | null;
  certificate_history: unknown;
  mental_assessment: string | null;
  assessment_result: (typeof ASSESSMENT_RESULTS)[number];
  assessment_remarks: string | null;
  assessment_date: string | null;
  assessor_name: string | null;
  assessment_answers: unknown;
  assessment_approved_by: number | null;
  assessment_approved_at: string | null;
  authorized_signature: string | null;
  authorized_signatory: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
};

export type EmployeeListRow = Pick<
  EmployeeRow,
  | "id" | "full_name" | "company_name" | "employee_id" | "phone_number" | "employee_photo" | "job_position" | "training_date"
  | "certificate_number" | "certificate_issue_date" | "certificate_expiry_date" | "certificate_status" | "certificate_pdf_path"
  | "assessment_result" | "assessment_approved_at" | "created_at"
> & { registered_by: string | null };

export const LIST_COLUMNS = `e.id, e.full_name, e.company_name, e.employee_id, e.phone_number, e.employee_photo, e.job_position, e.training_date,
  e.certificate_number, e.certificate_issue_date, e.certificate_expiry_date, e.certificate_status, e.certificate_pdf_path,
  e.assessment_result, e.assessment_approved_at, e.created_at, u.full_name AS registered_by`;

export type EmployeeFilters = {
  q: string;
  company: string;
  position: string;
  status: string; // Active | Expired | Revoked | None | ExpiringSoon
  result: string; // Passed | Failed | Pending | Unapproved
  registeredBy: string;
  dateField: string;
  from: string;
  to: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
};

const SORTABLE: Record<string, string> = {
  full_name: "e.full_name",
  company: "e.company_name",
  employee_id: "e.employee_id",
  position: "e.job_position",
  training_date: "e.training_date",
  certificate_number: "e.certificate_number",
  issue_date: "e.certificate_issue_date",
  expiry_date: "e.certificate_expiry_date",
  result: "e.assessment_result",
  status: "e.certificate_status",
  created_at: "e.created_at",
};

const DATE_FIELDS: Record<string, string> = {
  training: "e.training_date",
  issue: "e.certificate_issue_date",
  expiry: "e.certificate_expiry_date",
  registered: "e.created_at",
};

type Params = Record<string, string | string[] | undefined>;

export function parseFilters(params: Params | URLSearchParams, defaults: Partial<EmployeeFilters> = {}): EmployeeFilters {
  const get = (k: string) => {
    const v = params instanceof URLSearchParams ? params.get(k) : params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 150) ?? "";
  };
  const date = (k: string) => (isValidDate(get(k)) ? get(k) : "");
  const page = Number(get("page"));
  return {
    q: get("q"),
    company: get("company"),
    position: get("position"),
    status: get("status") || defaults.status || "",
    result: get("result") || defaults.result || "",
    registeredBy: /^\d+$/.test(get("registeredBy")) ? get("registeredBy") : "",
    dateField: get("dateField") in DATE_FIELDS ? get("dateField") : "training",
    from: date("from"),
    to: date("to"),
    sort: get("sort") in SORTABLE ? get("sort") : defaults.sort || "created_at",
    dir: get("dir") === "asc" ? "asc" : get("dir") === "desc" ? "desc" : defaults.dir || "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: defaults.pageSize ?? 25,
  };
}

/** Users assigned to a company see and handle that company's records only. Super Admins are never limited. */
export function companyScope(user: PortalUser): string | null {
  return user.role === "Super Admin" ? null : user.assigned_company;
}

export function buildWhere(user: PortalUser, f: EmployeeFilters, expiringSoonDays = 30): { sql: string; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];
  const scope = companyScope(user);
  if (scope) {
    where.push("e.company_name = ?");
    params.push(scope);
  }
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, "\\$&")}%`;
    where.push("(e.full_name LIKE ? OR e.employee_id LIKE ? OR e.company_name LIKE ? OR e.certificate_number LIKE ? OR e.phone_number LIKE ? OR e.job_position LIKE ?)");
    params.push(like, like, like, like, like, like);
  }
  if (f.company) {
    where.push("e.company_name = ?");
    params.push(f.company);
  }
  if (f.position) {
    where.push("e.job_position = ?");
    params.push(f.position);
  }
  if (f.status === "None") where.push("e.certificate_status IS NULL");
  else if (f.status === "Issued") where.push("e.certificate_status IS NOT NULL");
  else if (f.status === "ExpiringSoon") {
    where.push("e.certificate_status = 'Active' AND e.certificate_expiry_date BETWEEN ? AND ?");
    params.push(todayStr(), addDays(todayStr(), expiringSoonDays));
  } else if ((CERTIFICATE_STATUSES as readonly string[]).includes(f.status)) {
    where.push("e.certificate_status = ?");
    params.push(f.status);
  }
  if (f.result === "Unapproved") where.push("(e.assessment_result = 'Pending' OR e.assessment_approved_at IS NULL)");
  else if ((ASSESSMENT_RESULTS as readonly string[]).includes(f.result)) {
    where.push("e.assessment_result = ?");
    params.push(f.result);
  }
  if (f.registeredBy) {
    where.push("e.created_by = ?");
    params.push(f.registeredBy);
  }
  const column = DATE_FIELDS[f.dateField];
  if (f.from) {
    where.push(`${column} >= ?`);
    params.push(f.from);
  }
  if (f.to) {
    // Registered is a DATETIME, so compare against the start of the following day.
    where.push(`${column} < ?`);
    params.push(addDays(f.to, 1));
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export async function listEmployees(user: PortalUser, f: EmployeeFilters, expiringSoonDays = 30): Promise<{ rows: EmployeeListRow[]; total: number }> {
  const { sql, params } = buildWhere(user, f, expiringSoonDays);
  const [{ total }] = await query<{ total: number }>(`SELECT COUNT(*) AS total FROM employee_certificates e ${sql}`, params);
  // NULLs last, whichever way the column is sorted; id keeps paging stable when values tie.
  const column = SORTABLE[f.sort];
  const rows = await query<EmployeeListRow>(
    `SELECT ${LIST_COLUMNS} FROM employee_certificates e LEFT JOIN users u ON u.id = e.created_by ${sql}
     ORDER BY ${column} IS NULL, ${column} ${f.dir === "asc" ? "ASC" : "DESC"}, e.id DESC LIMIT ? OFFSET ?`,
    [...params, f.pageSize, (f.page - 1) * f.pageSize],
  );
  return { rows, total: Number(total) };
}

/** Rows for reports and exports, capped so one request can't exhaust the server. */
export async function exportEmployees(user: PortalUser, f: EmployeeFilters, expiringSoonDays = 30, limit = 20000): Promise<EmployeeListRow[]> {
  const { sql, params } = buildWhere(user, f, expiringSoonDays);
  const column = SORTABLE[f.sort];
  return query<EmployeeListRow>(
    `SELECT ${LIST_COLUMNS} FROM employee_certificates e LEFT JOIN users u ON u.id = e.created_by ${sql}
     ORDER BY ${column} IS NULL, ${column} ${f.dir === "asc" ? "ASC" : "DESC"}, e.id DESC LIMIT ?`,
    [...params, limit],
  );
}

/** A record, or null if it doesn't exist or lies outside the user's company. Scoping happens here so no route can skip it. */
export async function getEmployee(user: PortalUser, id: number): Promise<EmployeeRow | null> {
  const row = await queryOne<EmployeeRow>("SELECT * FROM employee_certificates WHERE id = ?", [id]);
  if (!row) return null;
  const scope = companyScope(user);
  if (scope && row.company_name !== scope) return null;
  if (!can(user.role, "assessments.manage")) {
    // Only assessors see what was said in an assessment. The result itself stays visible.
    row.mental_assessment = null;
    row.assessment_remarks = null;
    row.assessment_answers = null;
    row.assessor_name = null;
  }
  return row;
}

export function certificateHistory(row: Pick<EmployeeRow, "certificate_history">): CertificateHistoryEntry[] {
  return parseJson<CertificateHistoryEntry[]>(row.certificate_history, []);
}

export async function filterOptions(user: PortalUser): Promise<{ companies: string[]; positions: string[]; registrars: { id: number; full_name: string }[] }> {
  const scope = companyScope(user);
  const where = scope ? "WHERE company_name = ?" : "";
  const params = scope ? [scope] : [];
  const [companies, positions, registrars] = await Promise.all([
    query<{ v: string }>(`SELECT DISTINCT company_name AS v FROM employee_certificates ${where} ORDER BY v LIMIT 500`, params),
    query<{ v: string }>(`SELECT DISTINCT job_position AS v FROM employee_certificates ${where} ORDER BY v LIMIT 500`, params),
    can(user.role, "reports.view")
      ? query<{ id: number; full_name: string }>(`SELECT DISTINCT u.id, u.full_name FROM users u JOIN employee_certificates e ON e.created_by = u.id ${scope ? "WHERE e.company_name = ?" : ""} ORDER BY u.full_name`, params)
      : Promise.resolve([]),
  ]);
  return { companies: companies.map((r) => r.v), positions: positions.map((r) => r.v), registrars };
}

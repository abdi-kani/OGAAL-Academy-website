import "server-only";
import crypto from "node:crypto";
import { ApiError } from "./api";
import { audit } from "./audit";
import { renderCertificatePdf } from "./certificate-pdf";
import { query, queryOne, run, transaction } from "./db";
import { addOneYear, todayStr } from "./dates";
import { certificateHistory, type CertificateHistoryEntry, type EmployeeRow } from "./employees";
import { getSettings, nextSequence } from "./settings";
import { readFile, removeFile, writeFile } from "./storage";

type Qualifying = Pick<EmployeeRow, "assessment_result" | "assessment_approved_at" | "training_date">;

/** Business rule: a certificate needs a training date and an approved, passed assessment. */
export function qualifiesForCertificate(row: Qualifying): boolean {
  return row.assessment_result === "Passed" && Boolean(row.assessment_approved_at) && Boolean(row.training_date);
}

export function disqualifiedReason(row: Qualifying): string | null {
  if (!row.training_date) return "Enter the training date first.";
  if (row.assessment_result !== "Passed") return "The assessment result must be Passed.";
  if (!row.assessment_approved_at) return "The assessment must be approved first.";
  return null;
}

async function newCertificateFields(issueDate: string) {
  const year = issueDate.slice(0, 4);
  const sequence = await nextSequence(year);
  const settings = await getSettings();
  return {
    certificate_number: `CERT-${year}-${String(sequence).padStart(5, "0")}`,
    certificate_issue_date: issueDate,
    certificate_expiry_date: addOneYear(issueDate),
    verification_token: crypto.randomBytes(16).toString("hex"),
    authorized_signature: settings.signature_path || null,
    authorized_signatory: settings.signatory_name || null,
  };
}

const CERT_UPDATE = `certificate_number = ?, certificate_issue_date = ?, certificate_expiry_date = ?, certificate_validity = '1 Year',
  certificate_status = 'Active', certificate_revocation_reason = NULL, certificate_pdf_path = NULL, verification_token = ?,
  authorized_signature = ?, authorized_signatory = ?`;

const certParams = (c: Awaited<ReturnType<typeof newCertificateFields>>) => [
  c.certificate_number,
  c.certificate_issue_date,
  c.certificate_expiry_date,
  c.verification_token,
  c.authorized_signature,
  c.authorized_signatory,
];

/** Issues the first certificate if the record qualifies. Returns the number, or null if nothing was issued. */
export async function issueIfQualified(id: number, actorId: number, ip?: string): Promise<string | null> {
  const fields = await newCertificateFieldsIfNeeded(id);
  if (!fields) return null;
  const issued = await transaction(async (conn) => {
    const row = await queryOne<EmployeeRow>("SELECT * FROM employee_certificates WHERE id = ? FOR UPDATE", [id], conn);
    if (!row || row.certificate_number || !qualifiesForCertificate(row)) return false;
    await run(`UPDATE employee_certificates SET ${CERT_UPDATE} WHERE id = ?`, [...certParams(fields), id], conn);
    return true;
  });
  if (!issued) return null;
  await audit({ userId: actorId, action: "certificate.issue", recordType: "employee", recordRef: id, details: { certificate_number: fields.certificate_number }, ip });
  await generatePdf(id);
  return fields.certificate_number;
}

// A quick check first, so saving a record that doesn't qualify never spends a certificate number.
async function newCertificateFieldsIfNeeded(id: number) {
  const row = await queryOne<EmployeeRow>("SELECT certificate_number, assessment_result, assessment_approved_at, training_date FROM employee_certificates WHERE id = ?", [id]);
  if (!row || row.certificate_number || !qualifiesForCertificate(row)) return null;
  return newCertificateFields(todayStr());
}

/** Writes a new PDF for the current certificate and removes the one it replaces. */
export async function generatePdf(id: number): Promise<string | null> {
  const row = await queryOne<EmployeeRow>("SELECT * FROM employee_certificates WHERE id = ?", [id]);
  if (!row?.certificate_number) return null;
  const pdf = await renderCertificatePdf(row, await getSettings());
  const path = await writeFile(`certificates/${row.certificate_number.slice(5, 9)}`, "pdf", pdf, row.certificate_number);
  await run("UPDATE employee_certificates SET certificate_pdf_path = ? WHERE id = ?", [path, id]);
  await removeFile(row.certificate_pdf_path);
  return path;
}

/** The stored PDF, rebuilt if it was never written or has gone missing from storage. */
export async function readCurrentPdf(row: EmployeeRow): Promise<Buffer | null> {
  if (!row.certificate_number) return null;
  const existing = row.certificate_pdf_path ? await readFile(row.certificate_pdf_path) : null;
  if (existing) return existing;
  const path = await generatePdf(row.id);
  return path ? readFile(path) : null;
}

/** Issues a new number and a new year, keeping the previous certificate in the row's history. */
export async function renewCertificate(id: number, actorId: number, opts: { trainingDate?: string | null; allowRevoked: boolean; ip?: string }): Promise<string> {
  const check = await queryOne<EmployeeRow>("SELECT * FROM employee_certificates WHERE id = ?", [id]);
  if (!check?.certificate_number) throw new ApiError(409, "This employee has no certificate to renew.");
  if (check.certificate_status === "Revoked" && !opts.allowRevoked) throw new ApiError(403, "Only a Super Admin can renew a revoked certificate.");
  const reason = disqualifiedReason({ ...check, training_date: opts.trainingDate || check.training_date });
  if (reason) throw new ApiError(409, reason);

  const fields = await newCertificateFields(todayStr());
  const replaced = await transaction(async (conn) => {
    const row = await queryOne<EmployeeRow>("SELECT * FROM employee_certificates WHERE id = ? FOR UPDATE", [id], conn);
    // A second renewal racing this one changes the number; stop rather than renew twice.
    if (!row || row.certificate_number !== check.certificate_number) throw new ApiError(409, "This certificate has just been changed. Please reload.");
    const entry: CertificateHistoryEntry = {
      certificate_number: row.certificate_number!,
      issue_date: row.certificate_issue_date!,
      expiry_date: row.certificate_expiry_date!,
      status: row.certificate_status!,
      pdf_path: row.certificate_pdf_path,
      verification_token: row.verification_token!,
      replaced_at: new Date().toISOString(),
      replaced_by: actorId,
    };
    const history = JSON.stringify([...certificateHistory(row), entry]);
    await run(`UPDATE employee_certificates SET ${CERT_UPDATE}, certificate_history = ?, training_date = COALESCE(?, training_date) WHERE id = ?`, [
      ...certParams(fields),
      history,
      opts.trainingDate || null,
      id,
    ], conn);
    return entry.certificate_number;
  });
  await audit({ userId: actorId, action: "certificate.renew", recordType: "employee", recordRef: id, details: { previous: replaced, certificate_number: fields.certificate_number }, ip: opts.ip });
  await generatePdf(id);
  return fields.certificate_number;
}

export async function revokeCertificate(id: number, actorId: number, reason: string, ip?: string): Promise<void> {
  const res = await run("UPDATE employee_certificates SET certificate_status = 'Revoked', certificate_revocation_reason = ? WHERE id = ? AND certificate_number IS NOT NULL AND certificate_status <> 'Revoked'", [reason, id]);
  if (!res.affectedRows) throw new ApiError(409, "There is no certificate to revoke, or it is already revoked.");
  await audit({ userId: actorId, action: "certificate.revoke", recordType: "employee", recordRef: id, ip });
}

/** Run on a timer by the server, so certificates expire with nobody logged in. Valid through the expiry date itself. */
export async function sweepExpired(): Promise<number> {
  const res = await run("UPDATE employee_certificates SET certificate_status = 'Expired' WHERE certificate_status = 'Active' AND certificate_expiry_date < ?", [todayStr()]);
  if (res.affectedRows) await audit({ userId: null, action: "certificate.expire", recordType: "system", details: { count: res.affectedRows } });
  return res.affectedRows;
}

let lastSweep = 0;
/** Safety net for hosts where the background timer may be paused. Runs at most once every five minutes. */
export async function sweepExpiredThrottled(): Promise<void> {
  if (Date.now() - lastSweep < 300000) return;
  lastSweep = Date.now();
  await sweepExpired().catch((err) => console.error("Expiry sweep failed:", err.message));
}

export type VerificationResult =
  | { outcome: "NOT_FOUND" }
  | {
      outcome: "VALID" | "EXPIRED" | "REVOKED";
      replaced: boolean;
      full_name: string;
      company_name: string;
      employee_id: string;
      job_position: string;
      certificate_number: string;
      issue_date: string;
      expiry_date: string;
      status: string;
    };

const PUBLIC_COLUMNS = `full_name, company_name, employee_id, job_position, certificate_number, certificate_issue_date, certificate_expiry_date,
  certificate_status, verification_token, certificate_history`;

/** Lookup behind public verification. The column list is the guard: private fields are never read. */
export async function verifyCertificate(by: { number?: string; token?: string }): Promise<VerificationResult> {
  const column = by.token ? "verification_token" : "certificate_number";
  const value = by.token ?? by.number!.trim().toUpperCase();
  if (by.token ? !/^[a-f0-9]{32}$/.test(value) : !/^CERT-\d{4}-\d{5,}$/.test(value)) return { outcome: "NOT_FOUND" };

  type Row = Pick<EmployeeRow, "full_name" | "company_name" | "employee_id" | "job_position" | "certificate_number" | "certificate_issue_date" | "certificate_expiry_date" | "certificate_status" | "verification_token" | "certificate_history">;
  const current = await queryOne<Row>(`SELECT ${PUBLIC_COLUMNS} FROM employee_certificates WHERE ${column} = ?`, [value]);
  if (current) {
    // The date decides, so a certificate reads as expired from the first moment, whatever the timer has done.
    const expired = current.certificate_expiry_date! < todayStr();
    const outcome = current.certificate_status === "Revoked" ? "REVOKED" : expired ? "EXPIRED" : "VALID";
    return {
      outcome,
      replaced: false,
      full_name: current.full_name,
      company_name: current.company_name,
      employee_id: current.employee_id,
      job_position: current.job_position,
      certificate_number: current.certificate_number!,
      issue_date: current.certificate_issue_date!,
      expiry_date: current.certificate_expiry_date!,
      status: outcome === "REVOKED" ? "Revoked" : expired ? "Expired" : "Active",
    };
  }

  // An older certificate replaced by renewal must still answer, not read as a forgery.
  const key = by.token ? "verification_token" : "certificate_number";
  const rows = await query<Row>(`SELECT ${PUBLIC_COLUMNS} FROM employee_certificates WHERE JSON_SEARCH(certificate_history, 'one', ?, NULL, '$[*].${key}') IS NOT NULL LIMIT 1`, [value]);
  const owner = rows[0];
  const old = owner && certificateHistory(owner).find((h) => h[key] === value);
  if (!owner || !old) return { outcome: "NOT_FOUND" };
  const revoked = old.status === "Revoked";
  return {
    outcome: revoked ? "REVOKED" : "EXPIRED",
    replaced: true,
    full_name: owner.full_name,
    company_name: owner.company_name,
    employee_id: owner.employee_id,
    job_position: owner.job_position,
    certificate_number: old.certificate_number,
    issue_date: old.issue_date,
    expiry_date: old.expiry_date,
    status: revoked ? "Revoked" : "Replaced by a newer certificate",
  };
}

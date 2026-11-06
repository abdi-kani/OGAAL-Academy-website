import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { ApiError } from "./api";
import { addDays, addOneYear, isValidDate, todayStr } from "./dates";
import { putFile, ConflictError } from "./github";
import { encryptedJsonFile } from "./store";

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
export const ASSESSMENT_RESULTS = ["Pending", "Passed", "Failed"] as const;
export const EXPIRING_SOON_DAYS = 30;

export type CertificateStatus = "Not issued" | "Active" | "Expiring Soon" | "Expired";

/** One record per employee. Certificate status is not stored: it is calculated from the expiry date each time. */
export type EmployeeRecord = {
  id: string;
  fullName: string;
  companyName: string;
  employeeId: string;
  phoneNumber: string;
  bloodGroup: string;
  employeePhoto: string | null;
  dateOfBirth: string;
  jobPosition: string;
  trainingDate: string;
  certificateNumber: string | null;
  certificateIssueDate: string | null;
  certificateExpiryDate: string | null;
  certificateValidity: "1 Year";
  mentalAssessment: string;
  assessmentResult: (typeof ASSESSMENT_RESULTS)[number];
  assessmentRemarks: string;
  authorizedSignature: { name: string; title: string; asset: string | null } | null;
  revision: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

type Collection = {
  /** Highest number used per year. Kept even when a record is deleted, so numbers are never reused. */
  lastCertificateNumber: Record<string, number>;
  lastBackupOn: string | null;
  employees: EmployeeRecord[];
};

const collection = encryptedJsonFile<Collection>("data/employees.json.enc", {
  kind: "employees",
  message: "Update employee records",
  empty: () => ({ lastCertificateNumber: {}, lastBackupOn: null, employees: [] }),
  // The first change of each day saves the data as it stood before that change.
  beforeWrite: async (current, draft) => {
    const today = todayStr();
    if (!current.sha || current.value.lastBackupOn === today) return;
    try {
      await putFile(`backups/employees-${today}.json.enc`, collection.seal(current.value), "Daily backup");
      draft.lastBackupOn = today;
    } catch (err) {
      // Another server instance made today's backup first.
      if (err instanceof ConflictError) draft.lastBackupOn = today;
      else console.error("Daily backup failed, will retry on the next change:", (err as Error).message);
    }
  },
});

const loadCollection = cache(collection.read);

export function certificateStatus(row: Pick<EmployeeRecord, "certificateExpiryDate">, today = todayStr()): CertificateStatus {
  const expiry = row.certificateExpiryDate;
  if (!expiry) return "Not issued";
  if (expiry < today) return "Expired";
  return expiry <= addDays(today, EXPIRING_SOON_DAYS) ? "Expiring Soon" : "Active";
}

/** Why this employee cannot get a certificate right now, or null if they can. */
export function issueBlocker(row: EmployeeRecord, today = todayStr()): string | null {
  const status = certificateStatus(row, today);
  if (status === "Active" || status === "Expiring Soon") return "This employee already has a valid certificate.";
  if (row.assessmentResult !== "Passed") return "The assessment result must be Passed before a certificate can be issued.";
  return null;
}

export type StatusFilter = "" | "Active" | "ExpiringSoon" | "Expired" | "NotIssued" | "Ready";
export type Filters = { q: string; status: StatusFilter; page: number };
const PAGE_SIZE = 25;

export function parseFilters(params: { q?: string; status?: string; page?: string }): Filters {
  const status = (["Active", "ExpiringSoon", "Expired", "NotIssued", "Ready"] as const).find((s) => s === params.status) ?? "";
  return { q: (params.q ?? "").trim().slice(0, 100), status, page: Math.max(1, Math.floor(Number(params.page)) || 1) };
}

function matchesStatus(row: EmployeeRecord, filter: StatusFilter, today: string): boolean {
  if (!filter) return true;
  if (filter === "Ready") return !issueBlocker(row, today);
  const status = certificateStatus(row, today);
  return status === { Active: "Active", ExpiringSoon: "Expiring Soon", Expired: "Expired", NotIssued: "Not issued" }[filter];
}

export async function listEmployees(filters: Filters) {
  const { employees } = await loadCollection();
  const today = todayStr();
  const q = filters.q.toLowerCase();
  const rows = employees
    .filter((r) => matchesStatus(r, filters.status, today))
    .filter((r) => !q || [r.fullName, r.employeeId, r.certificateNumber ?? "", r.companyName, r.phoneNumber].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (filters.page - 1) * PAGE_SIZE;
  return { rows: rows.slice(start, start + PAGE_SIZE), total: rows.length, pageSize: PAGE_SIZE };
}

export async function getEmployee(id: string): Promise<EmployeeRecord | null> {
  return (await loadCollection()).employees.find((r) => r.id === id) ?? null;
}

export async function dashboardStats() {
  const { employees, lastBackupOn } = await loadCollection();
  const today = todayStr();
  const count = (status: CertificateStatus) => employees.filter((r) => certificateStatus(r, today) === status).length;
  return { employees: employees.length, active: count("Active"), expired: count("Expired"), expiringSoon: count("Expiring Soon"), ready: employees.filter((r) => !issueBlocker(r, today)).length, lastBackupOn };
}

/* ---------------------------------- Input ---------------------------------- */

/** Values printed on certificates must be drawable by the certificate's fonts (Latin script). */
const PRINTABLE = /^[\x20-\x7E -ÿ‘’“”–—]*$/;

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
};
const longText = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
};

export function fail(fields: Record<string, string>): never {
  throw new ApiError(422, "Please check the highlighted fields.", fields);
}

export function printableProblem(value: string): string | null {
  return PRINTABLE.test(value) ? null : "Use Latin letters so this prints correctly on the certificate.";
}

type EmployeeInput = Pick<EmployeeRecord, "fullName" | "companyName" | "employeeId" | "phoneNumber" | "bloodGroup" | "dateOfBirth" | "jobPosition" | "trainingDate" | "mentalAssessment" | "assessmentResult" | "assessmentRemarks">;

export function parseEmployeeForm(form: FormData): EmployeeInput {
  const today = todayStr();
  const errors: Record<string, string> = {};
  const printable = (key: string, label: string, max: number) => {
    const v = text(form, key);
    const problem = printableProblem(v);
    if (!v) errors[key] = `${label} is required.`;
    else if (v.length > max) errors[key] = `Use ${max} characters or fewer.`;
    else if (problem) errors[key] = problem;
    return v;
  };
  const input: EmployeeInput = {
    fullName: printable("fullName", "Full name", 150),
    companyName: printable("companyName", "Company name", 150),
    employeeId: printable("employeeId", "Employee ID", 50),
    phoneNumber: text(form, "phoneNumber"),
    bloodGroup: text(form, "bloodGroup"),
    dateOfBirth: text(form, "dateOfBirth"),
    jobPosition: printable("jobPosition", "Job position", 120),
    trainingDate: text(form, "trainingDate"),
    mentalAssessment: longText(form, "mentalAssessment"),
    assessmentResult: (text(form, "assessmentResult") || "Pending") as EmployeeInput["assessmentResult"],
    assessmentRemarks: longText(form, "assessmentRemarks"),
  };
  if (!/^\+?[0-9 ()-]{6,30}$/.test(input.phoneNumber)) errors.phoneNumber = "Enter a valid phone number.";
  if (!(BLOOD_GROUPS as readonly string[]).includes(input.bloodGroup)) errors.bloodGroup = "Choose a blood group.";
  if (!isValidDate(input.dateOfBirth) || input.dateOfBirth >= today) errors.dateOfBirth = "Enter a valid date of birth in the past.";
  if (!isValidDate(input.trainingDate) || input.trainingDate > today) errors.trainingDate = "Enter a valid date that is not in the future.";
  if (!(ASSESSMENT_RESULTS as readonly string[]).includes(input.assessmentResult)) errors.assessmentResult = "Choose a result.";
  if (input.mentalAssessment.length > 5000) errors.mentalAssessment = "Use 5000 characters or fewer.";
  if (input.assessmentRemarks.length > 5000) errors.assessmentRemarks = "Use 5000 characters or fewer.";
  if (Object.keys(errors).length) fail(errors);
  return input;
}

/* ---------------------------------- Changes ---------------------------------- */

function assertUniqueEmployeeId(employees: EmployeeRecord[], input: EmployeeInput, ownId?: string) {
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  if (employees.some((r) => r.id !== ownId && same(r.employeeId, input.employeeId) && same(r.companyName, input.companyName))) {
    fail({ employeeId: "This company already has an employee with this ID." });
  }
}

export function createEmployee(input: EmployeeInput, photo: string | null, username: string): Promise<EmployeeRecord> {
  return collection.update((doc) => {
    assertUniqueEmployeeId(doc.employees, input);
    const now = new Date().toISOString();
    const record: EmployeeRecord = {
      ...input,
      id: crypto.randomUUID(),
      employeePhoto: photo,
      certificateNumber: null,
      certificateIssueDate: null,
      certificateExpiryDate: null,
      certificateValidity: "1 Year",
      authorizedSignature: null,
      revision: 1,
      createdAt: now,
      createdBy: username,
      updatedAt: now,
      updatedBy: username,
    };
    doc.employees.push(record);
    return record;
  });
}

/** `revision` is the version the form was opened on, so two admins editing one record can't silently overwrite each other. */
export function updateEmployee(id: string, revision: number, input: EmployeeInput, photo: string | null, username: string): Promise<{ record: EmployeeRecord; replacedPhoto: string | null }> {
  return collection.update((doc) => {
    const record = doc.employees.find((r) => r.id === id);
    if (!record) throw new ApiError(404, "Employee not found.");
    if (record.revision !== revision) throw new ApiError(409, "Another administrator changed this record while you were editing. Reload the page and enter your change again.");
    assertUniqueEmployeeId(doc.employees, input, id);
    const replacedPhoto = photo ? record.employeePhoto : null;
    Object.assign(record, input, { employeePhoto: photo ?? record.employeePhoto, revision: record.revision + 1, updatedAt: new Date().toISOString(), updatedBy: username });
    return { record, replacedPhoto };
  });
}

export function deleteEmployee(id: string, confirm: unknown): Promise<EmployeeRecord> {
  return collection.update((doc) => {
    const index = doc.employees.findIndex((r) => r.id === id);
    if (index < 0) throw new ApiError(404, "Employee not found.");
    if (confirm !== doc.employees[index].employeeId) fail({ confirm: "This does not match the Employee ID." });
    return doc.employees.splice(index, 1)[0];
  });
}

/** Number and dates are set in the same write, so a number can't be handed out twice even across server instances. */
export function issueCertificate(id: string, signature: EmployeeRecord["authorizedSignature"], username: string): Promise<EmployeeRecord> {
  return collection.update((doc) => {
    const record = doc.employees.find((r) => r.id === id);
    if (!record) throw new ApiError(404, "Employee not found.");
    const today = todayStr();
    const blocker = issueBlocker(record, today);
    if (blocker) throw new ApiError(409, blocker);
    const year = today.slice(0, 4);
    const next = (doc.lastCertificateNumber[year] ?? 0) + 1;
    doc.lastCertificateNumber[year] = next;
    Object.assign(record, {
      certificateNumber: `OGAAL-${year}-${String(next).padStart(5, "0")}`,
      certificateIssueDate: today,
      certificateExpiryDate: addOneYear(today),
      authorizedSignature: signature,
      revision: record.revision + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: username,
    });
    return record;
  });
}

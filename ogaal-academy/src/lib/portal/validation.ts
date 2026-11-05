import "server-only";
import { ApiError } from "./api";
import { isValidDate, todayStr } from "./dates";
import { ASSESSMENT_RESULTS, BLOOD_GROUPS } from "./permissions";

/** Values printed on certificates must be drawable by the certificate's fonts (Latin script). */
const PRINTABLE = /^[ -~ -ÿ‘’“”–—]*$/;

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

export type EmployeeInput = {
  full_name: string;
  company_name: string;
  employee_id: string;
  phone_number: string;
  blood_group: string;
  date_of_birth: string;
  job_position: string;
  training_date: string | null;
};

export function parseEmployee(form: FormData): EmployeeInput {
  const today = todayStr();
  const errors: Record<string, string> = {};
  const printable = (key: string, label: string, max: number) => {
    const v = text(form, key);
    if (!v) errors[key] = `${label} is required.`;
    else if (v.length > max) errors[key] = `Use ${max} characters or fewer.`;
    else if (!PRINTABLE.test(v)) errors[key] = "Use Latin letters so this prints correctly on the certificate.";
    return v;
  };
  const input: EmployeeInput = {
    full_name: printable("full_name", "Full name", 150),
    company_name: printable("company_name", "Company name", 150),
    employee_id: printable("employee_id", "Employee ID", 50),
    phone_number: text(form, "phone_number"),
    blood_group: text(form, "blood_group") || "Unknown",
    date_of_birth: text(form, "date_of_birth"),
    job_position: printable("job_position", "Job position", 120),
    training_date: text(form, "training_date") || null,
  };
  if (!/^\+?[0-9 ()-]{6,30}$/.test(input.phone_number)) errors.phone_number = "Enter a valid phone number.";
  if (!(BLOOD_GROUPS as readonly string[]).includes(input.blood_group)) errors.blood_group = "Choose a blood group.";
  if (!isValidDate(input.date_of_birth) || input.date_of_birth >= today) errors.date_of_birth = "Enter a valid date of birth in the past.";
  if (input.training_date && (!isValidDate(input.training_date) || input.training_date > today)) errors.training_date = "Enter a valid date that is not in the future.";
  if (Object.keys(errors).length) fail(errors);
  return input;
}

export type AssessmentInput = {
  mental_assessment: string | null;
  assessment_result: "Pending" | "Passed" | "Failed";
  assessment_remarks: string | null;
  assessment_date: string | null;
  assessor_name: string | null;
  answers: { question: string; answer: string }[];
  approve: boolean;
};

export function parseAssessment(form: FormData, questions: string[]): AssessmentInput {
  const errors: Record<string, string> = {};
  const result = text(form, "assessment_result") || "Pending";
  const date = text(form, "assessment_date") || null;
  const assessor = text(form, "assessor_name") || null;
  const approve = form.get("approve") === "on";
  if (!(ASSESSMENT_RESULTS as readonly string[]).includes(result)) errors.assessment_result = "Choose a result.";
  if (date && (!isValidDate(date) || date > todayStr())) errors.assessment_date = "Enter a valid date that is not in the future.";
  if (assessor && assessor.length > 150) errors.assessor_name = "Use 150 characters or fewer.";
  if (approve) {
    if (result === "Pending") errors.assessment_result = "A pending result cannot be approved.";
    if (!date) errors.assessment_date = "Enter the assessment date before approving.";
    if (!assessor) errors.assessor_name = "Enter the assessor before approving.";
  }
  const mental = longText(form, "mental_assessment");
  const remarks = longText(form, "assessment_remarks");
  if (mental.length > 5000) errors.mental_assessment = "Use 5000 characters or fewer.";
  if (remarks.length > 5000) errors.assessment_remarks = "Use 5000 characters or fewer.";
  if (Object.keys(errors).length) fail(errors);
  return {
    mental_assessment: mental || null,
    assessment_result: result as AssessmentInput["assessment_result"],
    assessment_remarks: remarks || null,
    assessment_date: date,
    assessor_name: assessor,
    answers: questions.map((question, i) => ({ question, answer: longText(form, `answer_${i}`).slice(0, 2000) })),
    approve,
  };
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 190;
export const isUsername = (v: string) => /^[a-z0-9._-]{3,60}$/.test(v);

/**
 * Shared enquiry validation — used by the browser form AND the server route,
 * so both sides apply exactly the same rules.
 */
import { contactPage } from "@/content/site";

export type EnquiryKind = "contact" | "admissions";

export type EnquiryInput = {
  kind: EnquiryKind;
  fullName: string;
  email: string;
  phone: string;
  enquiryType: string; // contact form
  applicantType: string; // admissions form: Individual | Organisation
  organisationName: string; // admissions form, required for organisations
  message: string;
  consent: boolean;
};

export type EnquiryField = Exclude<keyof EnquiryInput, "kind">;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

export const APPLICANT_TYPES = ["Individual", "Organisation"] as const;
export const LIMITS = { name: 120, email: 200, phone: 30, org: 160, message: 3000 };

export const emptyEnquiry = (kind: EnquiryKind): EnquiryInput => ({
  kind,
  fullName: "",
  email: "",
  phone: "",
  enquiryType: "",
  applicantType: "",
  organisationName: "",
  message: "",
  consent: false,
});

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/;
const PHONE_RE = /^\+?[0-9\s()-]{7,20}$/;

export function validateEnquiry(v: EnquiryInput): EnquiryErrors {
  const e: EnquiryErrors = {};
  const name = v.fullName.trim();
  if (name.length < 2) e.fullName = "Please enter your full name.";
  else if (name.length > LIMITS.name) e.fullName = `Please keep your name under ${LIMITS.name} characters.`;

  const email = v.email.trim();
  if (!email) e.email = "Please enter your email address.";
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email))
    e.email = "Please enter a valid email address, for example name@example.com.";

  const phone = v.phone.trim();
  if (v.kind === "admissions" && !phone) e.phone = "Please enter a phone number so the admissions team can reach you.";
  else if (phone && !PHONE_RE.test(phone)) e.phone = "Please enter a valid phone number using digits, spaces, or a leading +.";

  if (v.kind === "contact") {
    if (!(contactPage.enquiryTypes as readonly string[]).includes(v.enquiryType)) e.enquiryType = "Please choose an enquiry type.";
  } else {
    if (!(APPLICANT_TYPES as readonly string[]).includes(v.applicantType)) e.applicantType = "Please choose Individual or Organisation.";
    if (v.applicantType === "Organisation") {
      const org = v.organisationName.trim();
      if (org.length < 2) e.organisationName = "Please enter your organisation’s name.";
      else if (org.length > LIMITS.org) e.organisationName = `Please keep the organisation name under ${LIMITS.org} characters.`;
    }
  }

  const msg = v.message.trim();
  if (msg.length < 10) e.message = "Please enter a message of at least 10 characters.";
  else if (msg.length > LIMITS.message) e.message = `Please keep your message under ${LIMITS.message.toLocaleString("en")} characters.`;

  if (!v.consent) e.consent = "Please confirm that the academy may contact you about this enquiry.";
  return e;
}

/** Coerce untrusted JSON into an EnquiryInput (server side). */
export function coerceEnquiry(raw: unknown): EnquiryInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const s = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : "");
  const kind = s("kind") === "admissions" ? "admissions" : s("kind") === "contact" ? "contact" : null;
  if (!kind) return null;
  return {
    kind,
    fullName: s("fullName"),
    email: s("email"),
    phone: s("phone"),
    enquiryType: s("enquiryType"),
    applicantType: s("applicantType"),
    organisationName: kind === "admissions" && s("applicantType") === "Organisation" ? s("organisationName") : "",
    message: s("message"),
    consent: r.consent === true,
  };
}

export const FIELD_LABELS: Record<EnquiryField, string> = {
  fullName: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  enquiryType: "Enquiry Type",
  applicantType: "Individual or Organisation",
  organisationName: "Organisation Name",
  message: "Message",
  consent: "Consent",
};

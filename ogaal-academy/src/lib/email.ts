import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { contact } from "@/content/site";
import type { EnquiryInput } from "./enquiry";

/**
 * Enquiry email delivery. Every form submission is emailed to the academy inbox
 * (default: info@ogaalacademy.so). Credentials stay on the server only.
 *
 * Option A — SMTP (recommended: use the info@ogaalacademy.so mailbox's own outgoing-mail settings)
 *   SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USER, SMTP_PASS
 *   SMTP_FROM (optional)  default: "OGAAL Academy Website <SMTP_USER>"
 *
 * Option B — Resend API (https://resend.com)
 *   RESEND_API_KEY, ENQUIRY_FROM_EMAIL (sender on a domain verified in Resend)
 *
 * Recipient for both: ENQUIRY_TO_EMAIL (optional, comma-separated). Default: info@ogaalacademy.so
 * Replies: Reply-To is always the visitor's email address.
 */
const env = process.env;

const smtpConfigured = () => Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
const resendConfigured = () => Boolean(env.RESEND_API_KEY && env.ENQUIRY_FROM_EMAIL);

export function isEmailConfigured(): boolean {
  return smtpConfigured() || resendConfigured();
}

function recipients(): string[] {
  const list = (env.ENQUIRY_TO_EMAIL || contact.email.address).split(",").map((s) => s.trim()).filter(Boolean);
  return list;
}

const clean = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

function compose(e: EnquiryInput, ip: string) {
  const isAdmissions = e.kind === "admissions";
  const subject = isAdmissions
    ? `Admissions enquiry — ${clean(e.fullName)}${e.organisationName ? ` (${clean(e.organisationName)})` : ""}`
    : `Website enquiry (${clean(e.enquiryType)}) — ${clean(e.fullName)}`;
  const text = [
    `Form: ${isAdmissions ? "Admissions enquiry" : "Contact enquiry"}`,
    `Name: ${clean(e.fullName)}`,
    `Email: ${clean(e.email)}`,
    `Phone: ${clean(e.phone) || "—"}`,
    isAdmissions ? `Applicant: ${clean(e.applicantType)}` : `Enquiry type: ${clean(e.enquiryType)}`,
    ...(isAdmissions && e.organisationName ? [`Organisation: ${clean(e.organisationName)}`] : []),
    `Consent to be contacted: yes`,
    "",
    "Message:",
    e.message.trim(),
    "",
    `— Sent from the OGAAL Academy website. Reply to this email to answer ${clean(e.fullName)} directly. Sender IP: ${ip}`,
  ].join("\n");
  return { subject, text, replyTo: clean(e.email) };
}

let transporter: Transporter | null = null;
function smtp() {
  if (!transporter) {
    const port = Number(env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
}

export async function sendEnquiryEmail(e: EnquiryInput, meta: { ip: string }): Promise<boolean> {
  const { subject, text, replyTo } = compose(e, meta.ip);
  const to = recipients();

  if (smtpConfigured()) {
    const info = await smtp().sendMail({
      from: env.SMTP_FROM || `"OGAAL Academy Website" <${env.SMTP_USER}>`,
      to,
      replyTo,
      subject,
      text,
    });
    return (info.accepted?.length ?? 0) > 0;
  }

  const res = await fetch(env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.ENQUIRY_FROM_EMAIL, to, reply_to: replyTo, subject, text }),
    signal: AbortSignal.timeout(10000),
  });
  return res.ok;
}

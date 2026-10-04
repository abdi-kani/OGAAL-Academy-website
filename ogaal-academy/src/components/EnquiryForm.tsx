"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, Info, LoaderCircle, Send } from "lucide-react";
import { contactPage } from "@/content/site";
import {
  APPLICANT_TYPES,
  FIELD_LABELS,
  LIMITS,
  emptyEnquiry,
  validateEnquiry,
  type EnquiryErrors,
  type EnquiryField,
  type EnquiryInput,
  type EnquiryKind,
} from "@/lib/enquiry";

type Status = "idle" | "submitting" | "success" | "unavailable" | "rate_limited" | "error";

/**
 * Enquiry form (contact or admissions). Posts to /api/enquiry.
 * Success is shown ONLY when the server confirms delivery; on any failure the visitor's
 * entries are kept in the form.
 */
export function EnquiryForm({
  kind,
  available,
  submitLabel,
  title,
  intro,
}: {
  kind: EnquiryKind;
  available: boolean;
  submitLabel: string;
  title: string;
  intro?: ReactNode;
}) {
  const params = useSearchParams();
  const [values, setValues] = useState<EnquiryInput>(() => emptyEnquiry(kind));
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<EnquiryField, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [showSummary, setShowSummary] = useState(false);
  const startedAt = useRef<number>(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const idp = kind === "admissions" ? "adm" : "enq";
  const fid = (f: string) => `${idp}-${f}`;

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Prefill from links such as /contact?type=Training&topic=Two-Day%20Programme
  useEffect(() => {
    if (kind !== "contact") return;
    const type = params.get("type");
    const topic = params.get("topic");
    setValues((v) => ({
      ...v,
      enquiryType: !v.enquiryType && type && (contactPage.enquiryTypes as readonly string[]).includes(type) ? type : v.enquiryType,
      message: !v.message && topic ? `I would like to know more about: ${topic.slice(0, 80)}.\n\n` : v.message,
    }));
  }, [params, kind]);

  const update = <K extends EnquiryField>(k: K, val: EnquiryInput[K]) => {
    const next = { ...values, [k]: val };
    setValues(next);
    if (touched[k] || showSummary) setErrors(validateEnquiry(next));
    if (status === "success" || status === "error") setStatus("idle");
  };
  // Validate on blur only once something has been typed (avoids layout shift under the submit button)
  const blur = (k: EnquiryField) => {
    const v = values[k];
    if (typeof v === "string" && !v.trim()) return;
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validateEnquiry(values));
  };

  const visibleError = (k: EnquiryField) => (touched[k] || showSummary ? errors[k] : undefined);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateEnquiry(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setShowSummary(true);
      setStatus("idle");
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setShowSummary(false);
    setStatus("submitting");
    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website, startedAt: startedAt.current }),
      });
      if (res.ok) {
        setStatus("success");
        setValues(emptyEnquiry(kind));
        setTouched({});
      } else if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors ?? {});
        setShowSummary(true);
        setStatus("idle");
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      } else if (res.status === 503) setStatus("unavailable");
      else if (res.status === 429) setStatus("rate_limited");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  const errorKeys = (Object.keys(errors) as EnquiryField[]).filter((k) => errors[k]);
  const inputCls = (k: EnquiryField) =>
    `mt-2 block w-full rounded-xl border bg-white px-4 py-3 text-navy placeholder:text-body/50 transition-[border-color,box-shadow] focus:outline-none focus-visible:outline-none focus:ring-4 ${
      visibleError(k)
        ? "border-red-700 focus:border-red-700 focus:ring-red-700/15"
        : "border-[#cdd8e8] hover:border-body/50 focus:border-blue focus:ring-blue/15"
    }`;
  const describedBy = (k: EnquiryField, hint?: string) =>
    [hint, visibleError(k) ? fid(`${k}-error`) : null].filter(Boolean).join(" ") || undefined;
  const Err = ({ k }: { k: EnquiryField }) =>
    visibleError(k) ? (
      <p id={fid(`${k}-error`)} className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-red-700">
        <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        {visibleError(k)}
      </p>
    ) : null;
  const Req = () => (
    <span aria-hidden="true" className="text-blue">
      {" "}*
    </span>
  );
  const firstControl = (k: EnquiryField) =>
    k === "enquiryType" ? fid("type-0") : k === "applicantType" ? fid("applicant-0") : fid(k);

  const choiceCls = (checked: boolean) =>
    `flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 font-semibold transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue/25 ${
      checked ? "border-blue bg-blue-50 text-navy" : "border-[#cdd8e8] bg-white text-navy hover:border-body/50"
    }`;

  return (
    <div className="card p-6 sm:p-9">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      {intro && <div className="mt-3 text-body">{intro}</div>}

      {!available && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-50 p-4 text-sm text-amber-950">
          <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p>
            <strong>Online enquiries are not available yet.</strong> This form is not yet connected to the academy’s
            email, so messages cannot be sent. Anything you type stays in the form on this page.
          </p>
        </div>
      )}

      <p className="mt-6 text-sm text-body">
        Fields marked <span aria-hidden="true" className="font-bold text-blue">*</span>
        <span className="sr-only">with an asterisk</span> are required.
      </p>

      {showSummary && errorKeys.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-5 rounded-xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold">Please correct the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorKeys.map((k) => (
              <li key={k}>
                <a href={`#${firstControl(k)}`} className="underline">
                  {FIELD_LABELS[k]}: {errors[k]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form noValidate onSubmit={onSubmit} className="relative mt-6 grid gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor={fid("fullName")} className="font-semibold text-navy">
              Full Name<Req />
            </label>
            <input
              id={fid("fullName")}
              name="fullName"
              autoComplete="name"
              maxLength={LIMITS.name}
              aria-required="true"
              aria-invalid={!!visibleError("fullName")}
              aria-describedby={describedBy("fullName")}
              value={values.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              onBlur={() => blur("fullName")}
              className={inputCls("fullName")}
            />
            <Err k="fullName" />
          </div>
          <div>
            <label htmlFor={fid("email")} className="font-semibold text-navy">
              {kind === "admissions" ? "Email" : "Email Address"}
              <Req />
            </label>
            <input
              id={fid("email")}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={LIMITS.email}
              aria-required="true"
              aria-invalid={!!visibleError("email")}
              aria-describedby={describedBy("email")}
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => blur("email")}
              className={inputCls("email")}
            />
            <Err k="email" />
          </div>
        </div>

        <div>
          <label htmlFor={fid("phone")} className="font-semibold text-navy">
            {kind === "admissions" ? (
              <>
                Phone
                <Req />
              </>
            ) : (
              <>
                Phone Number <span className="font-normal text-body">(optional)</span>
              </>
            )}
          </label>
          <input
            id={fid("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={LIMITS.phone}
            aria-required={kind === "admissions" ? "true" : undefined}
            aria-invalid={!!visibleError("phone")}
            aria-describedby={describedBy("phone")}
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            onBlur={() => blur("phone")}
            className={inputCls("phone")}
          />
          <Err k="phone" />
        </div>

        {kind === "contact" ? (
          <fieldset aria-describedby={describedBy("enquiryType")}>
            <legend className="font-semibold text-navy">
              Enquiry Type<Req />
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {contactPage.enquiryTypes.map((t, i) => (
                <label key={t} htmlFor={fid(`type-${i}`)} className={`${choiceCls(values.enquiryType === t)} ${i === contactPage.enquiryTypes.length - 1 && contactPage.enquiryTypes.length % 2 ? "sm:col-span-2" : ""}`}>
                  <input
                    id={fid(`type-${i}`)}
                    type="radio"
                    name="enquiryType"
                    value={t}
                    checked={values.enquiryType === t}
                    aria-invalid={!!visibleError("enquiryType")}
                    onChange={() => {
                      setTouched((x) => ({ ...x, enquiryType: true }));
                      update("enquiryType", t);
                    }}
                    className="h-4 w-4 accent-blue"
                  />
                  {t === "General" ? "General enquiry" : t}
                </label>
              ))}
            </div>
            <Err k="enquiryType" />
          </fieldset>
        ) : (
          <>
            <fieldset aria-describedby={describedBy("applicantType")}>
              <legend className="font-semibold text-navy">
                Individual or Organisation<Req />
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {APPLICANT_TYPES.map((t, i) => (
                  <label key={t} htmlFor={fid(`applicant-${i}`)} className={choiceCls(values.applicantType === t)}>
                    <input
                      id={fid(`applicant-${i}`)}
                      type="radio"
                      name="applicantType"
                      value={t}
                      checked={values.applicantType === t}
                      aria-invalid={!!visibleError("applicantType")}
                      onChange={() => {
                        setTouched((x) => ({ ...x, applicantType: true }));
                        update("applicantType", t);
                      }}
                      className="h-4 w-4 accent-blue"
                    />
                    {t}
                  </label>
                ))}
              </div>
              <Err k="applicantType" />
            </fieldset>
            {values.applicantType === "Organisation" && (
              <div>
                <label htmlFor={fid("organisationName")} className="font-semibold text-navy">
                  Organisation Name<Req />
                </label>
                <input
                  id={fid("organisationName")}
                  name="organisationName"
                  autoComplete="organization"
                  maxLength={LIMITS.org}
                  aria-required="true"
                  aria-invalid={!!visibleError("organisationName")}
                  aria-describedby={describedBy("organisationName")}
                  value={values.organisationName}
                  onChange={(e) => update("organisationName", e.target.value)}
                  onBlur={() => blur("organisationName")}
                  className={inputCls("organisationName")}
                />
                <Err k="organisationName" />
              </div>
            )}
          </>
        )}

        <div>
          <label htmlFor={fid("message")} className="font-semibold text-navy">
            Message<Req />
          </label>
          <textarea
            id={fid("message")}
            name="message"
            rows={6}
            maxLength={LIMITS.message}
            aria-required="true"
            aria-invalid={!!visibleError("message")}
            aria-describedby={describedBy("message", fid("message-hint"))}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            onBlur={() => blur("message")}
            className={`${inputCls("message")} resize-y`}
          />
          <p id={fid("message-hint")} className="mt-2 text-sm text-body">
            {kind === "admissions"
              ? "Ask about eligibility, requirements, or the next programme. Do not include ID numbers, medical or criminal-record details."
              : "Tell us what you would like to know, for example training dates, admission requirements, or training for your team."}
          </p>
          <Err k="message" />
        </div>

        <div>
          <label htmlFor={fid("consent")} className="flex cursor-pointer items-start gap-3 text-navy">
            <input
              id={fid("consent")}
              name="consent"
              type="checkbox"
              checked={values.consent}
              aria-required="true"
              aria-invalid={!!visibleError("consent")}
              aria-describedby={describedBy("consent")}
              onChange={(e) => {
                setTouched((x) => ({ ...x, consent: true }));
                update("consent", e.target.checked);
              }}
              className="mt-1 h-5 w-5 shrink-0 accent-blue"
            />
            <span>
              I agree that OGAAL Academy may contact me about this enquiry.<Req />
            </span>
          </label>
          <Err k="consent" />
        </div>

        {/* Honeypot: hidden from people and assistive technology */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={fid("website")}>Website</label>
          <input id={fid("website")} name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-56" disabled={status === "submitting"} aria-disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                {submitLabel}
                <Send size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        <div ref={statusRef} tabIndex={-1} aria-live="polite" className="focus:outline-none">
          {status === "success" && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-700/30 bg-emerald-50 p-4 text-emerald-950">
              <CircleCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p>
                <strong>Thank you — your enquiry has been sent.</strong> The academy will reply to the email address
                you provided.
              </p>
            </div>
          )}
          {status === "unavailable" && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-50 p-4 text-amber-950">
              <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p>
                <strong>Your enquiry was not sent.</strong> Online enquiries are not available yet. Your details are
                still in the form.
              </p>
            </div>
          )}
          {status === "rate_limited" && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-700/30 bg-red-50 p-4 text-red-900">
              <CircleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p>
                <strong>Your enquiry was not sent.</strong> Too many enquiries were sent from this connection. Please
                wait a few minutes and try again. Your details are still in the form.
              </p>
            </div>
          )}
          {status === "error" && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-700/30 bg-red-50 p-4 text-red-900">
              <CircleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p>
                <strong>Your enquiry could not be sent.</strong> Please check your connection and try again. Your
                details are still in the form.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

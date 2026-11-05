"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BLOOD_GROUPS } from "@/lib/portal/permissions";
import { AssessmentFields, type AssessmentValues } from "./AssessmentFields";
import { Field, FormError, SelectField, useSubmit } from "./form";

type Values = {
  id: number;
  full_name: string;
  company_name: string;
  employee_id: string;
  phone_number: string;
  blood_group: string;
  date_of_birth: string;
  job_position: string;
  training_date: string | null;
  has_photo: boolean;
  certificate_number: string | null;
  certificate_issue_date: string | null;
  certificate_expiry_date: string | null;
  certificate_status: string | null;
  authorized_signatory: string | null;
};

const MAX_PHOTO = 5 * 1024 * 1024;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2>{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export function EmployeeForm({
  employee,
  assignedCompany,
  canAssess,
  questions,
  signatory,
  today,
}: {
  employee?: Values;
  assignedCompany: string | null;
  canAssess: boolean;
  questions: string[];
  signatory: string;
  today: string;
}) {
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [preview, setPreview] = useState<string | null>(employee?.has_photo ? `/api/portal/employees/${employee.id}/photo` : null);
  const [photoError, setPhotoError] = useState<string>();

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoError(undefined);
    if (!file) return;
    if (file.size > MAX_PHOTO) {
      e.target.value = "";
      setPhotoError("The image must be 5 MB or smaller.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const res = employee ? await submit(`/api/portal/employees/${employee.id}`, data, "PATCH") : await submit("/api/portal/employees", data);
    if (res) {
      router.push(`/portal/employees/${res.id}?saved=1`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError message={error} />

      <Section title="Employee details">
        <Field label="Full Name" name="full_name" required maxLength={150} defaultValue={employee?.full_name} error={fields.full_name} />
        <Field
          label="Company Name"
          name="company_name"
          required
          maxLength={150}
          defaultValue={assignedCompany ?? employee?.company_name}
          readOnly={Boolean(assignedCompany)}
          error={fields.company_name}
          hint={assignedCompany ? "Set by your account." : undefined}
        />
        <Field label="Employee ID" name="employee_id" required maxLength={50} defaultValue={employee?.employee_id} error={fields.employee_id} />
        <Field label="Phone Number" name="phone_number" type="tel" required maxLength={30} defaultValue={employee?.phone_number} error={fields.phone_number} />
        <SelectField label="Blood Group" name="blood_group" options={BLOOD_GROUPS} defaultValue={employee?.blood_group ?? "Unknown"} error={fields.blood_group} />
        <Field label="Date of Birth" name="date_of_birth" type="date" required max={today} defaultValue={employee?.date_of_birth} error={fields.date_of_birth} />
        <Field label="Job Position" name="job_position" required maxLength={120} defaultValue={employee?.job_position} error={fields.job_position} />
        <div className="sm:col-span-2">
          <label htmlFor="f-employee_photo" className="portal-label">
            Employee Photo
          </label>
          <div className="flex items-center gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected employee photo preview" className="h-20 w-16 rounded-md border border-line object-cover" />
            ) : (
              <div className="grid h-20 w-16 place-items-center rounded-md border border-dashed border-line text-center text-[0.65rem]">No photo</div>
            )}
            <div className="min-w-0 flex-1">
              <input id="f-employee_photo" name="employee_photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="portal-input" />
              <p className={`mt-1 text-xs ${fields.employee_photo || photoError ? "font-medium text-red-800" : ""}`}>{fields.employee_photo || photoError || "JPG, PNG or WebP, up to 5 MB."}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Training">
        <Field label="Training Date" name="training_date" type="date" max={today} defaultValue={employee?.training_date ?? ""} error={fields.training_date} hint="Needed before a certificate can be issued." />
      </Section>

      {canAssess && !employee && (
        <section className="panel p-5">
          <h2>Mental assessment</h2>
          <p className="mt-1 text-sm">Optional at registration. This records the authorised assessor&apos;s result; the system never decides one.</p>
          <input type="hidden" name="include_assessment" value="1" />
          <div className="mt-4">
            <AssessmentFields values={EMPTY_ASSESSMENT} questions={questions} fields={fields} today={today} />
          </div>
        </section>
      )}

      <Section title="Certificate (automatic)">
        <Field label="Certificate Number" name="_number" readOnly value={employee?.certificate_number ?? "Generated on issue"} />
        <Field label="Issue Date" name="_issue" readOnly value={employee?.certificate_issue_date ?? "Set on issue"} />
        <Field label="Expiry Date" name="_expiry" readOnly value={employee?.certificate_expiry_date ?? "Issue date + 1 year"} />
        <Field label="Validity" name="_validity" readOnly value="1 Year" />
        <Field label="Certificate Status" name="_status" readOnly value={employee?.certificate_status ?? "Not issued"} />
        <Field label="Authorized Signature" name="_signature" readOnly value={employee?.authorized_signatory || signatory || "Set by a Super Admin in Settings"} />
        <p className="text-sm sm:col-span-2 lg:col-span-3">A certificate and its PDF are created automatically once the training date is set and a passed assessment has been approved.</p>
      </Section>

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saving…" : employee ? "Save changes" : "Register employee"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

const EMPTY_ASSESSMENT: AssessmentValues = {
  mental_assessment: null,
  assessment_result: "Pending",
  assessment_remarks: null,
  assessment_date: null,
  assessor_name: null,
  answers: [],
  approved: false,
};

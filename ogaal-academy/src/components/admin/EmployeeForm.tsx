"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormError, SelectField, TextAreaField, useSubmit } from "./form";

// Mirrors the server's lists in lib/admin/employees.ts, which can't be imported into browser code.
const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const ASSESSMENT_RESULTS = ["Pending", "Passed", "Failed"];
const MAX_PHOTO = 4 * 1024 * 1024;

type Values = {
  id: string;
  revision: number;
  fullName: string;
  companyName: string;
  employeeId: string;
  phoneNumber: string;
  bloodGroup: string;
  dateOfBirth: string;
  jobPosition: string;
  trainingDate: string;
  mentalAssessment: string;
  assessmentResult: string;
  assessmentRemarks: string;
  hasPhoto: boolean;
  certificateNumber: string | null;
  certificateIssueDate: string | null;
  certificateExpiryDate: string | null;
  certificateStatus: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2>{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export function EmployeeForm({ employee, signatory, today }: { employee?: Values; signatory: string; today: string }) {
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [preview, setPreview] = useState<string | null>(employee?.hasPhoto ? `/api/admin/employees/${employee.id}/photo` : null);
  const [photoError, setPhotoError] = useState<string>();

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoError(undefined);
    if (!file) return;
    if (file.size > MAX_PHOTO) {
      e.target.value = "";
      setPhotoError("The image must be 4 MB or smaller.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (employee) data.set("revision", String(employee.revision));
    const res = employee ? await submit(`/api/admin/employees/${employee.id}`, data, "PATCH") : await submit("/api/admin/employees", data);
    if (res) {
      router.push(`/admin/employees/${String(res.id)}?saved=1`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError message={error} />

      <Section title="Personal information">
        <Field label="Full Name" name="fullName" required maxLength={150} defaultValue={employee?.fullName} error={fields.fullName} />
        <Field label="Company Name" name="companyName" required maxLength={150} defaultValue={employee?.companyName} error={fields.companyName} />
        <Field label="Employee ID" name="employeeId" required maxLength={50} defaultValue={employee?.employeeId} error={fields.employeeId} />
        <Field label="Phone Number" name="phoneNumber" type="tel" required maxLength={30} defaultValue={employee?.phoneNumber} error={fields.phoneNumber} />
        <SelectField label="Blood Group" name="bloodGroup" required options={employee ? BLOOD_GROUPS : ["", ...BLOOD_GROUPS]} defaultValue={employee?.bloodGroup} error={fields.bloodGroup} />
        <Field label="Date of Birth" name="dateOfBirth" type="date" required max={today} defaultValue={employee?.dateOfBirth} error={fields.dateOfBirth} />
        <Field label="Job Position" name="jobPosition" required maxLength={120} defaultValue={employee?.jobPosition} error={fields.jobPosition} />
        <div className="sm:col-span-2">
          <label htmlFor="f-employeePhoto" className="admin-label">Employee Photo</label>
          <div className="flex items-center gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected employee photo preview" className="h-20 w-16 rounded-md border border-line object-cover" />
            ) : (
              <div className="grid h-20 w-16 place-items-center rounded-md border border-dashed border-line text-center text-[0.65rem]">No photo</div>
            )}
            <div className="min-w-0 flex-1">
              <input id="f-employeePhoto" name="employeePhoto" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="admin-input" />
              <p className={`mt-1 text-xs ${fields.employeePhoto || photoError ? "font-medium text-red-800" : ""}`}>{fields.employeePhoto || photoError || "JPG, PNG or WebP, up to 4 MB."}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Training information">
        <Field label="Training Date" name="trainingDate" type="date" required max={today} defaultValue={employee?.trainingDate} error={fields.trainingDate} />
      </Section>

      <section className="panel p-5">
        <h2>Assessment information</h2>
        <p className="mt-1 text-sm">Records the authorised assessor&apos;s result; the system never decides one. Private: never printed on the certificate.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField label="Assessment Result" name="assessmentResult" options={ASSESSMENT_RESULTS} defaultValue={employee?.assessmentResult ?? "Pending"} error={fields.assessmentResult} hint="Must be Passed before a certificate can be issued." />
          <TextAreaField className="sm:col-span-2" label="Mental Assessment" name="mentalAssessment" defaultValue={employee?.mentalAssessment} error={fields.mentalAssessment} />
          <TextAreaField className="sm:col-span-2" label="Assessment Remarks" name="assessmentRemarks" defaultValue={employee?.assessmentRemarks} error={fields.assessmentRemarks} />
        </div>
      </section>

      <Section title="Certificate information (automatic)">
        <Field label="Certificate Number" name="_number" readOnly disabled value={employee?.certificateNumber ?? "Generated on issue"} />
        <Field label="Issue Date" name="_issue" readOnly disabled value={employee?.certificateIssueDate ?? "Set on issue"} />
        <Field label="Expiry Date" name="_expiry" readOnly disabled value={employee?.certificateExpiryDate ?? "Issue date + 1 year"} />
        <Field label="Validity" name="_validity" readOnly disabled value="1 Year" />
        <Field label="Certificate Status" name="_status" readOnly disabled value={employee?.certificateStatus ?? "Not issued"} />
        <Field label="Authorized Signature" name="_signature" readOnly disabled value={signatory || "Set in Settings"} />
      </Section>

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : employee ? "Save changes" : "Register employee"}</button>
        <button type="button" onClick={() => router.back()} className="btn btn-outline">Cancel</button>
      </div>
    </form>
  );
}

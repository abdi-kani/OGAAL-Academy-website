"use client";

import { ASSESSMENT_RESULTS } from "@/lib/portal/permissions";
import { Field, SelectField, TextAreaField } from "./form";

export type AssessmentValues = {
  mental_assessment: string | null;
  assessment_result: string;
  assessment_remarks: string | null;
  assessment_date: string | null;
  assessor_name: string | null;
  answers: { question: string; answer: string }[];
  approved: boolean;
};

export function AssessmentFields({ values, questions, fields, today }: { values: AssessmentValues; questions: string[]; fields: Record<string, string>; today: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Assessment Date" name="assessment_date" type="date" max={today} defaultValue={values.assessment_date ?? ""} error={fields.assessment_date} />
      <Field label="Assessor" name="assessor_name" maxLength={150} defaultValue={values.assessor_name ?? ""} error={fields.assessor_name} />
      <SelectField label="Assessment Result" name="assessment_result" options={ASSESSMENT_RESULTS} defaultValue={values.assessment_result} error={fields.assessment_result} />
      {questions.map((q, i) => (
        <TextAreaField key={q} className="sm:col-span-2 lg:col-span-3" label={q} name={`answer_${i}`} rows={2} defaultValue={values.answers.find((a) => a.question === q)?.answer ?? ""} />
      ))}
      <TextAreaField className="sm:col-span-2 lg:col-span-3" label="Mental Assessment" name="mental_assessment" defaultValue={values.mental_assessment ?? ""} error={fields.mental_assessment} hint="The assessor's summary. Private: never printed or shown publicly." />
      <TextAreaField className="sm:col-span-2 lg:col-span-3" label="Assessment Remarks" name="assessment_remarks" defaultValue={values.assessment_remarks ?? ""} error={fields.assessment_remarks} hint="Private: never printed or shown publicly." />
      <label className="flex items-start gap-2 sm:col-span-2 lg:col-span-3">
        <input type="checkbox" name="approve" defaultChecked={false} className="mt-1 h-4 w-4" />
        <span className="text-sm font-medium text-navy">
          I approve this result{values.approved ? " again (this result is already approved)" : ""}. Only an approved pass qualifies for a certificate.
        </span>
      </label>
    </div>
  );
}

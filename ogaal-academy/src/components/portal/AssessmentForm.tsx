"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssessmentFields, type AssessmentValues } from "./AssessmentFields";
import { FormError, useSubmit } from "./form";
import { Notice } from "./ui";

export function AssessmentForm({ id, values, questions, today }: { id: number; values: AssessmentValues; questions: string[]; today: string }) {
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDone(null);
    const res = await submit(`/api/portal/employees/${id}/assessment`, new FormData(e.currentTarget));
    if (res) {
      setDone(res.certificate_number ? `Assessment saved. Certificate ${res.certificate_number} has been issued.` : "Assessment saved.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5" noValidate>
      <FormError message={error} />
      {done && <Notice tone="info">{done}</Notice>}
      <AssessmentFields values={values} questions={questions} fields={fields} today={today} />
      <button type="submit" disabled={busy} className="btn btn-primary">
        {busy ? "Saving…" : "Save assessment"}
      </button>
    </form>
  );
}

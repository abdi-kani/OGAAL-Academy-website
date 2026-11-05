"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormError, TextAreaField, useSubmit } from "./form";
import { Notice } from "./ui";

type Values = {
  signatory_name: string;
  expiring_soon_days: number;
  show_photo_on_certificate: boolean;
  show_assessment_on_certificate: boolean;
  assessment_questions: string[];
  has_signature: boolean;
  has_stamp: boolean;
  has_logo: boolean;
};

export function SettingsForm({ values }: { values: Values }) {
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const target = e.currentTarget;
    if (await submit("/api/portal/settings", new FormData(target))) {
      setSaved(true);
      target.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((i) => (i.value = ""));
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      {saved && <Notice tone="info">Settings saved. New and regenerated certificates will use them.</Notice>}

      <section className="panel p-5">
        <h2>Certificate signature and stamp</h2>
        <p className="mt-1 text-sm">Upload the academy&apos;s real signature and official stamp as images, ideally PNG with a transparent background. Until they are uploaded, certificates print with blank space to sign and stamp by hand.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field className="lg:col-span-3" label="Authorized signatory name" name="signatory_name" defaultValue={values.signatory_name} error={fields.signatory_name} />
          <ImageField label="Authorized signature" name="signature" exists={values.has_signature} error={fields.signature} />
          <ImageField label="Official stamp" name="stamp" exists={values.has_stamp} error={fields.stamp} />
          <ImageField label="Certificate logo" name="logo" exists={values.has_logo} error={fields.logo} hint="Optional. The academy's official logo is used by default." />
        </div>
      </section>

      <section className="panel space-y-3 p-5">
        <h2>Certificate content</h2>
        <label className="flex items-center gap-2 text-sm font-medium text-navy">
          <input type="checkbox" name="show_photo_on_certificate" defaultChecked={values.show_photo_on_certificate} className="h-4 w-4" />
          Show the employee photo on certificates
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-navy">
          <input type="checkbox" name="show_assessment_on_certificate" defaultChecked={values.show_assessment_on_certificate} className="h-4 w-4" />
          Show the approved assessment result on certificates
        </label>
        <Field className="max-w-xs" label="Expiring soon window (days)" name="expiring_soon_days" type="number" min={1} max={365} defaultValue={values.expiring_soon_days} error={fields.expiring_soon_days} />
      </section>

      <section className="panel p-5">
        <h2>Assessment questions</h2>
        <TextAreaField className="mt-3" label="One question per line" name="assessment_questions" rows={6} defaultValue={values.assessment_questions.join("\n")} error={fields.assessment_questions} hint="These started as placeholders: replace them with the questions approved by the academy's authorised assessors. Answers already recorded keep the wording they were given under." />
      </section>

      <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}

function ImageField({ label, name, exists, error, hint }: { label: string; name: string; exists: boolean; error?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="portal-label">{label}</label>
      {exists ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/portal/settings/asset/${name}`} alt={`Current ${label.toLowerCase()}`} className="mb-2 h-20 max-w-full rounded border border-line bg-white object-contain p-1" />
      ) : (
        <div className="mb-2 grid h-20 place-items-center rounded border border-dashed border-line text-xs">Not uploaded</div>
      )}
      <input id={`f-${name}`} name={name} type="file" accept="image/jpeg,image/png,image/webp" className="portal-input" />
      <p className={`mt-1 text-xs ${error ? "font-medium text-red-800" : ""}`}>{error || hint || "JPG, PNG or WebP, up to 5 MB."}</p>
    </div>
  );
}

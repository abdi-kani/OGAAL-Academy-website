"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormError, useSubmit } from "./form";
import { Notice } from "./ui";

type Values = { signatoryName: string; signatoryTitle: string; trainingTitle: string; hasSignature: boolean; hasSeal: boolean };

export function SettingsForm({ values }: { values: Values }) {
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const target = e.currentTarget;
    if (await submit("/api/admin/settings", new FormData(target))) {
      setSaved(true);
      target.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((i) => (i.value = ""));
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError message={error} />
      {saved && <Notice tone="info">Settings saved.</Notice>}

      <section className="panel p-5">
        <h2>Authorized signature and seal</h2>
        <p className="mt-1 text-sm">Upload the academy&apos;s real signature and official seal, ideally PNG with a transparent background. Until they are uploaded, certificates print with blank space to sign and stamp by hand. Certificates already issued keep the signature they were issued with.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Signatory name" name="signatoryName" defaultValue={values.signatoryName} error={fields.signatoryName} />
          <Field label="Signatory title" name="signatoryTitle" defaultValue={values.signatoryTitle} error={fields.signatoryTitle} />
          <ImageField label="Authorized signature" name="signature" exists={values.hasSignature} error={fields.signature} />
          <ImageField label="Academy seal" name="seal" exists={values.hasSeal} error={fields.seal} />
        </div>
      </section>

      <section className="panel p-5">
        <h2>Certificate content</h2>
        <Field className="mt-4 max-w-lg" label="Training title" name="trainingTitle" required defaultValue={values.trainingTitle} error={fields.trainingTitle} />
      </section>

      <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}

function ImageField({ label, name, exists, error }: { label: string; name: string; exists: boolean; error?: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="admin-label">{label}</label>
      {exists ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/admin/settings/asset/${name}`} alt={`Current ${label.toLowerCase()}`} className="mb-2 h-20 max-w-full rounded border border-line bg-white object-contain p-1" />
      ) : (
        <div className="mb-2 grid h-20 place-items-center rounded border border-dashed border-line text-xs">Not uploaded</div>
      )}
      <input id={`f-${name}`} name={name} type="file" accept="image/jpeg,image/png,image/webp" className="admin-input" />
      <p className={`mt-1 text-xs ${error ? "font-medium text-red-800" : ""}`}>{error || "JPG, PNG or WebP, up to 2 MB."}</p>
    </div>
  );
}

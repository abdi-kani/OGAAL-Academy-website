"use client";

import { useState } from "react";

export type ApiResult = Record<string, unknown>;

/** Submits to an admin API route and keeps the form-level and field-level errors it returns. */
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(url: string, body: FormData | object, method = "POST"): Promise<ApiResult | null> {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch(url, {
        method,
        ...(body instanceof FormData ? { body } : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
      });
      const data = (await res.json().catch(() => ({}))) as ApiResult;
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
        setFields((data.fields as Record<string, string>) ?? {});
        return null;
      }
      return data;
    } catch {
      setError("The server could not be reached. Please check your connection and try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, fields, submit };
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
      {message}
    </p>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "className">;

export function Field({ label, name, error, hint, required, className, ...input }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="admin-label">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </label>
      <input id={`f-${name}`} name={name} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? `e-${name}` : undefined} className="admin-input" {...input} />
      <FieldNote name={name} error={error} hint={hint} />
    </div>
  );
}

type SelectProps = {
  label: string;
  name: string;
  options: readonly string[];
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
};

export function SelectField({ label, name, options, error, hint, required, className, defaultValue }: SelectProps) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="admin-label">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </label>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue} aria-invalid={error ? true : undefined} aria-describedby={error ? `e-${name}` : undefined} className="admin-input">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <FieldNote name={name} error={error} hint={hint} />
    </div>
  );
}

export function TextAreaField({ label, name, error, hint, className, defaultValue, rows = 3 }: { label: string; name: string; error?: string; hint?: string; className?: string; defaultValue?: string; rows?: number }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="admin-label">
        {label}
      </label>
      <textarea id={`f-${name}`} name={name} rows={rows} defaultValue={defaultValue} aria-invalid={error ? true : undefined} aria-describedby={error ? `e-${name}` : undefined} className="admin-input" />
      <FieldNote name={name} error={error} hint={hint} />
    </div>
  );
}

function FieldNote({ name, error, hint }: { name: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`e-${name}`} className="mt-1 text-xs font-medium text-red-800">
        {error}
      </p>
    );
  return hint ? <p className="mt-1 text-xs">{hint}</p> : null;
}

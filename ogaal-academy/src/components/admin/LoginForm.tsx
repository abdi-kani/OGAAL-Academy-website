"use client";

import { Field, FormError, useSubmit } from "./form";

export function LoginForm() {
  const { busy, error, submit } = useSubmit();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await submit("/api/admin/auth/login", { username: form.get("username"), password: form.get("password") });
    // A full page load, so the first page is rendered with the new session cookie.
    if (res) window.location.assign(String(res.redirect));
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <Field label="Username" name="username" required autoComplete="username" autoFocus />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Logging in…" : "Login"}
      </button>
    </form>
  );
}

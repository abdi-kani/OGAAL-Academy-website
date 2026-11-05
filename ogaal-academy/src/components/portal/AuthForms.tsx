"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, FormError, useSubmit } from "./form";
import { Notice } from "./ui";

export function LoginForm() {
  const { busy, error, submit } = useSubmit();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await submit("/api/portal/auth/login", { login: form.get("login"), password: form.get("password") });
    // A full page load, so the first page is rendered with the new session cookie.
    if (res) window.location.assign(String(res.redirect));
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <Field label="Username or email" name="login" required autoComplete="username" autoFocus />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm">
        <Link href="/portal/forgot-password" className="font-medium text-blue hover:underline">Forgot password?</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const { busy, error, submit } = useSubmit();
  const [sent, setSent] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await submit("/api/portal/auth/forgot", { login: new FormData(e.currentTarget).get("login") })) setSent(true);
  }
  if (sent) {
    return (
      <div className="space-y-4">
        <Notice tone="info">If that account exists and is active, a reset link has been sent to its email address. The link expires in one hour.</Notice>
        <p className="text-sm">No email? Ask an administrator to reset your password.</p>
        <Link href="/portal/login" className="btn btn-outline w-full">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <Field label="Username or email" name="login" required autoComplete="username" autoFocus />
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Sending…" : "Send reset link"}</button>
      <p className="text-center text-sm">
        <Link href="/portal/login" className="font-medium text-blue hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { busy, error, fields, submit } = useSubmit();
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await submit("/api/portal/auth/reset", { token, password: new FormData(e.currentTarget).get("password") })) setDone(true);
  }
  if (done) {
    return (
      <div className="space-y-4">
        <Notice tone="info">Your password has been changed. You have been signed out everywhere else.</Notice>
        <Link href="/portal/login" className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <Field label="New password" name="password" type="password" required minLength={10} autoComplete="new-password" hint="At least 10 characters." error={fields.password} />
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Saving…" : "Set new password"}</button>
    </form>
  );
}

export function ChangePasswordForm({ required }: { required: boolean }) {
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.currentTarget;
    const form = new FormData(target);
    if (await submit("/api/portal/account/password", { current: form.get("current"), next: form.get("next") })) {
      target.reset();
      setDone(true);
      if (required) window.location.assign("/portal");
      else router.refresh();
    }
  }
  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <FormError message={error} />
      {done && <Notice tone="info">Password changed. Other devices have been signed out.</Notice>}
      <Field label={required ? "Temporary password" : "Current password"} name="current" type="password" required autoComplete="current-password" error={fields.current} />
      <Field label="New password" name="next" type="password" required minLength={10} autoComplete="new-password" hint="At least 10 characters." error={fields.next} />
      <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Change password"}</button>
    </form>
  );
}

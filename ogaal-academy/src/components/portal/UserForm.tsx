"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, FormError, SelectField, useSubmit } from "./form";
import { Notice } from "./ui";

type Values = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone_number: string | null;
  role: string;
  assigned_company: string | null;
  account_status: string;
  has_photo: boolean;
};

export function UserForm({ user, roles, lockedCompany, isSelf }: { user?: Values; roles: readonly string[]; lockedCompany: string | null; isSelf?: boolean }) {
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [temporary, setTemporary] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const data = new FormData(e.currentTarget);
    if (user) {
      if (await submit(`/api/portal/users/${user.id}`, data, "PATCH")) {
        setSaved(true);
        router.refresh();
      }
    } else {
      const res = await submit("/api/portal/users", data);
      if (res) {
        setTemporary(String(res.temporaryPassword));
        setCreatedId(Number(res.id));
      }
    }
  }

  async function resetPassword() {
    if (!user || !window.confirm(`Reset the password for ${user.full_name}? They will be signed out everywhere.`)) return;
    const res = await submit(`/api/portal/users/${user.id}`, {});
    if (res) setTemporary(String(res.temporaryPassword));
  }

  if (temporary && createdId) {
    return (
      <div className="panel max-w-xl space-y-4 p-5">
        <h2>Account created</h2>
        <TemporaryPassword value={temporary} />
        <Link href={`/portal/users/${createdId}`} className="btn btn-primary">Open account</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5" noValidate>
      <FormError message={error} />
      {saved && <Notice tone="info">Changes saved.</Notice>}
      {temporary && <TemporaryPassword value={temporary} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Full Name" name="full_name" required defaultValue={user?.full_name} error={fields.full_name} />
        <Field label="Username" name="username" required defaultValue={user?.username} error={fields.username} autoComplete="off" />
        <Field label="Email" name="email" type="email" required defaultValue={user?.email} error={fields.email} autoComplete="off" />
        <Field label="Phone Number" name="phone_number" type="tel" defaultValue={user?.phone_number ?? ""} error={fields.phone_number} />
        <SelectField label="Role" name="role" options={isSelf && user ? [user.role] : roles} defaultValue={user?.role ?? "Staff"} error={fields.role} hint={isSelf ? "You cannot change your own role." : undefined} />
        <Field
          label="Assigned Company"
          name="assigned_company"
          defaultValue={lockedCompany ?? user?.assigned_company ?? ""}
          readOnly={Boolean(lockedCompany)}
          error={fields.assigned_company}
          hint={lockedCompany ? "Set by your account." : "Leave empty for access to all companies. Set it to limit this user to one company's records."}
        />
        <SelectField label="Account Status" name="account_status" options={isSelf ? ["Active"] : ["Active", "Inactive"]} defaultValue={user?.account_status ?? "Active"} error={fields.account_status} />
        <div>
          <label htmlFor="f-profile_photo" className="portal-label">Profile Photo</label>
          <input id="f-profile_photo" name="profile_photo" type="file" accept="image/jpeg,image/png,image/webp" className="portal-input" />
          <p className={`mt-1 text-xs ${fields.profile_photo ? "font-medium text-red-800" : ""}`}>{fields.profile_photo || (user?.has_photo ? "A photo is on file. Choose one to replace it." : "Optional. JPG, PNG or WebP, up to 5 MB.")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : user ? "Save changes" : "Create account"}</button>
        {user && !isSelf && (
          <button type="button" disabled={busy} onClick={resetPassword} className="btn btn-outline">Reset password</button>
        )}
      </div>
    </form>
  );
}

function TemporaryPassword({ value }: { value: string }) {
  return (
    <Notice tone="warn">
      Temporary password: <code className="rounded bg-white px-2 py-0.5 font-mono text-navy select-all">{value}</code>
      <br />
      Copy it now and give it to the user privately. It will not be shown again, and they must change it at first sign-in.
    </Notice>
  );
}

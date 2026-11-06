"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, Download, Eye, Pencil, Printer, Trash2 } from "lucide-react";
import { Field, FormError, useSubmit } from "./form";

export type RowEmployee = {
  id: string;
  fullName: string;
  employeeId: string;
  certificateNumber: string | null;
  canIssue: boolean;
};

const itemClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-navy hover:bg-light";

export function printCertificate(id: string) {
  const url = `/api/admin/employees/${id}/certificate/pdf?inline=1`;
  // Phones and tablets can't print a PDF from a hidden frame, so they get it in a tab with the viewer's own print option.
  if (window.matchMedia("(pointer: coarse)").matches) {
    window.open(url, "_blank", "noopener");
    return;
  }
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.src = url;
  frame.onload = () => frame.contentWindow?.print();
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 120000);
}

export function RowActions({ employee, label = "Actions" }: { employee: RowEmployee; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { busy, error, fields, submit } = useSubmit();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const url = `/api/admin/employees/${employee.id}`;

  function close() {
    ref.current?.close();
  }

  async function issue() {
    const res = await submit(`${url}/certificate`, {});
    if (res) {
      setMessage(`Certificate ${String(res.certificateNumber)} issued.`);
      router.refresh();
    }
  }

  async function remove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await submit(url, { confirm: new FormData(e.currentTarget).get("confirm") }, "DELETE");
    if (res) {
      close();
      router.push("/admin/employees");
      router.refresh();
    }
  }

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => ref.current?.showModal()} aria-label={`${label} for ${employee.fullName}`}>
        {label}
      </button>
      <dialog ref={ref} className="admin-dialog" onClose={() => { setConfirming(false); setMessage(null); }}>
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate">{employee.fullName}</h2>
              <p className="text-xs">
                {employee.employeeId}
                {employee.certificateNumber ? ` · ${employee.certificateNumber}` : ""}
              </p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
          </div>
          <FormError message={error} />
          {message && <p className="mb-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-navy">{message}</p>}

          {!confirming ? (
            <div className="grid gap-0.5">
              <Link href={`/admin/employees/${employee.id}`} className={itemClass}><Eye size={16} aria-hidden="true" /> View</Link>
              <Link href={`/admin/employees/${employee.id}/edit`} className={itemClass}><Pencil size={16} aria-hidden="true" /> Edit</Link>
              {employee.canIssue && (
                <button type="button" className={itemClass} onClick={issue} disabled={busy}><Award size={16} aria-hidden="true" /> {busy ? "Issuing…" : "Generate Certificate"}</button>
              )}
              {employee.certificateNumber && (
                <>
                  <a href={`${url}/certificate/pdf`} className={itemClass}><Download size={16} aria-hidden="true" /> Generate PDF</a>
                  <button type="button" className={itemClass} onClick={() => printCertificate(employee.id)}><Printer size={16} aria-hidden="true" /> Print Certificate</button>
                </>
              )}
              <button type="button" className={`${itemClass} text-red-800`} onClick={() => setConfirming(true)}><Trash2 size={16} aria-hidden="true" /> Delete</button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={remove}>
              <p className="text-sm">This permanently deletes the employee&apos;s record and photo. It cannot be undone from this screen.</p>
              <Field label={`Type ${employee.employeeId} to confirm`} name="confirm" required autoComplete="off" error={fields.confirm} />
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="btn btn-danger">{busy ? "Deleting…" : "Delete permanently"}</button>
                <button type="button" className="btn btn-outline" onClick={() => setConfirming(false)}>Back</button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

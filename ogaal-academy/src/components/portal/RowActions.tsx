"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Download, Eye, FilePlus2, Pencil, Printer, RefreshCw, RotateCw, ShieldX, Trash2, type LucideIcon } from "lucide-react";
import { Field, FormError, useSubmit } from "./form";

export type RowPermissions = {
  edit: boolean;
  editIssued: boolean;
  assess: boolean;
  certificates: boolean;
  remove: boolean;
  renewRevoked: boolean;
};

export type RowEmployee = {
  id: number;
  full_name: string;
  employee_id: string;
  certificate_number: string | null;
  certificate_status: string | null;
};

type Panel = null | "renew" | "revoke" | "delete";

const itemClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-navy hover:bg-light";

export function RowActions({ employee, perms, today, label = "Actions" }: { employee: RowEmployee; perms: RowPermissions; today: string; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { busy, error, submit } = useSubmit();
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hasCert = Boolean(employee.certificate_number);
  const url = `/api/portal/employees/${employee.id}`;

  function close() {
    ref.current?.close();
    setPanel(null);
    setMessage(null);
  }

  async function certAction(body: object, done: (n: string) => string) {
    const res = await submit(`${url}/certificate`, body);
    if (res) {
      setPanel(null);
      setMessage(done(String(res.certificate_number ?? "")));
      router.refresh();
    }
  }

  function print() {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = `${url}/certificate/pdf?inline=1`;
    frame.onload = () => frame.contentWindow?.print();
    document.body.appendChild(frame);
    setTimeout(() => frame.remove(), 120000);
  }

  async function remove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const confirm = new FormData(e.currentTarget).get("confirm");
    const res = await submit(url, { confirm }, "DELETE");
    if (res) {
      close();
      router.push("/portal/employees");
      router.refresh();
    }
  }

  const Item = ({ icon: Icon, children, onClick, href, danger }: { icon: LucideIcon; children: React.ReactNode; onClick?: () => void; href?: string; danger?: boolean }) => {
    const cls = `${itemClass} ${danger ? "text-red-800" : ""}`;
    if (href) {
      return (
        <a href={href} className={cls} onClick={onClick}>
          <Icon size={16} aria-hidden="true" /> {children}
        </a>
      );
    }
    return (
      <button type="button" className={cls} onClick={onClick} disabled={busy}>
        <Icon size={16} aria-hidden="true" /> {children}
      </button>
    );
  };

  const canEdit = perms.edit && (!hasCert || perms.editIssued);
  const canRenew = hasCert && (employee.certificate_status !== "Revoked" || perms.renewRevoked);

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => ref.current?.showModal()} aria-label={`${label} for ${employee.full_name}`}>
        {label}
      </button>
      <dialog ref={ref} className="portal-dialog" onClose={() => { setPanel(null); setMessage(null); }}>
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate">{employee.full_name}</h2>
              <p className="text-xs">
                {employee.employee_id}
                {employee.certificate_number ? ` · ${employee.certificate_number}` : ""}
              </p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={close}>
              Close
            </button>
          </div>
          <FormError message={error} />
          {message && <p className="mb-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-navy">{message}</p>}

          {panel === null && (
            <div className="grid gap-0.5">
              <Link href={`/portal/employees/${employee.id}`} className={itemClass}>
                <Eye size={16} aria-hidden="true" /> View
              </Link>
              {canEdit && (
                <Link href={`/portal/employees/${employee.id}/edit`} className={itemClass}>
                  <Pencil size={16} aria-hidden="true" /> Edit
                </Link>
              )}
              {perms.assess && (
                <Link href={`/portal/assessments/${employee.id}`} className={itemClass}>
                  <ClipboardCheck size={16} aria-hidden="true" /> Record assessment
                </Link>
              )}
              {perms.certificates && !hasCert && (
                <Item icon={FilePlus2} onClick={() => certAction({ action: "issue" }, (n) => `Certificate ${n} issued.`)}>
                  Generate certificate
                </Item>
              )}
              {perms.certificates && hasCert && (
                <>
                  <Item icon={RefreshCw} onClick={() => certAction({ action: "regenerate" }, () => "PDF regenerated.")}>
                    Generate PDF again
                  </Item>
                  <Item icon={Download} href={`${url}/certificate/pdf`}>
                    Download PDF
                  </Item>
                  <Item icon={Printer} onClick={print}>
                    Print
                  </Item>
                  {canRenew && (
                    <Item icon={RotateCw} onClick={() => setPanel("renew")}>
                      Renew certificate
                    </Item>
                  )}
                  {employee.certificate_status !== "Revoked" && (
                    <Item icon={ShieldX} onClick={() => setPanel("revoke")} danger>
                      Revoke certificate
                    </Item>
                  )}
                </>
              )}
              {perms.remove && (
                <Item icon={Trash2} onClick={() => setPanel("delete")} danger>
                  Delete employee
                </Item>
              )}
            </div>
          )}

          {panel === "renew" && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                certAction({ action: "renew", training_date: new FormData(e.currentTarget).get("training_date") }, (n) => `Renewed. The new certificate is ${n}.`);
              }}
            >
              <p className="text-sm">This issues a new certificate number valid for one year from today. The current certificate moves to this employee&apos;s history and stops verifying as valid.</p>
              <Field label="New training date (optional)" name="training_date" type="date" max={today} />
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="btn btn-primary">
                  Renew
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setPanel(null)}>
                  Back
                </button>
              </div>
            </form>
          )}

          {panel === "revoke" && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                certAction({ action: "revoke", reason: new FormData(e.currentTarget).get("reason") }, () => "Certificate revoked.");
              }}
            >
              <p className="text-sm">Public verification will show REVOKED straight away.</p>
              <Field label="Reason" name="reason" required minLength={3} maxLength={255} />
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="btn btn-danger">
                  Revoke
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setPanel(null)}>
                  Back
                </button>
              </div>
            </form>
          )}

          {panel === "delete" && (
            <form className="space-y-3" onSubmit={remove}>
              <p className="text-sm">This permanently deletes the record, photo and certificates. It cannot be undone, and certificates already handed out will verify as NOT FOUND.</p>
              <Field label={`Type ${employee.employee_id} to confirm`} name="confirm" required autoComplete="off" />
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="btn btn-danger">
                  Delete permanently
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setPanel(null)}>
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

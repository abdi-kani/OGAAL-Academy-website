import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PageTitle({ title, intro, children }: { title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1>{title}</h1>
        {intro && <p className="mt-1 max-w-2xl">{intro}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null }) {
  const cls = status === "Active" ? "badge-good" : status === "Expired" ? "badge-warn" : status === "Revoked" ? "badge-bad" : "badge-none";
  return <span className={`badge ${cls}`}>{status ?? "Not issued"}</span>;
}

export function ResultBadge({ result, approved }: { result: string; approved?: boolean }) {
  const cls = result === "Passed" ? "badge-good" : result === "Failed" ? "badge-bad" : "badge-warn";
  return (
    <span className={`badge ${cls}`}>
      {result}
      {approved === false && result !== "Pending" ? " (unapproved)" : ""}
    </span>
  );
}

export function Pagination({ page, pageSize, total, href }: { page: number; pageSize: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total ? (page - 1) * pageSize + 1 : 0;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <p>
        Showing {first.toLocaleString("en-GB")}–{Math.min(page * pageSize, total).toLocaleString("en-GB")} of {total.toLocaleString("en-GB")}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="btn btn-outline btn-sm" rel="prev">
            <ChevronLeft size={15} aria-hidden="true" /> Previous
          </Link>
        )}
        <span>
          Page {page} of {pages.toLocaleString("en-GB")}
        </span>
        {page < pages && (
          <Link href={href(page + 1)} className="btn btn-outline btn-sm" rel="next">
            Next <ChevronRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export function DetailList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-semibold">{k}</dt>
          <dd className="break-words font-medium text-navy">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone = "warn", children }: { tone?: "warn" | "bad" | "info"; children: React.ReactNode }) {
  const cls = tone === "bad" ? "bg-red-50 text-red-900" : tone === "info" ? "bg-blue-50 text-navy" : "bg-amber-50 text-amber-900";
  return <div className={`rounded-lg px-4 py-3 text-sm font-medium ${cls}`}>{children}</div>;
}

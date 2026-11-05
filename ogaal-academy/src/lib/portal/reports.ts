import "server-only";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { site } from "@/content/site";
import type { PortalUser } from "./auth";
import { query } from "./db";
import { addDays, formatDate, todayStr } from "./dates";
import { companyScope, type EmployeeListRow } from "./employees";
import { getSettings } from "./settings";

export type DashboardStats = {
  employees: number;
  issued: number;
  active: number;
  expired: number;
  revoked: number;
  expiringSoon: number;
  pending: number;
  passed: number;
  failed: number;
  users: number;
  expiringSoonDays: number;
};

export async function dashboardStats(user: PortalUser): Promise<DashboardStats> {
  const scope = companyScope(user);
  const where = scope ? "WHERE company_name = ?" : "";
  const { expiring_soon_days: days } = await getSettings();
  const today = todayStr();
  const [row] = await query<Record<string, number>>(
    `SELECT COUNT(*) AS employees,
       SUM(certificate_status IS NOT NULL) AS current_certs,
       SUM(certificate_status = 'Active') AS active,
       SUM(certificate_status = 'Expired') AS expired,
       SUM(certificate_status = 'Revoked') AS revoked,
       SUM(certificate_status = 'Active' AND certificate_expiry_date BETWEEN ? AND ?) AS expiring,
       SUM(assessment_result = 'Pending') AS pending,
       SUM(assessment_result = 'Passed') AS passed,
       SUM(assessment_result = 'Failed') AS failed,
       SUM(COALESCE(JSON_LENGTH(certificate_history), 0)) AS earlier_certs
     FROM employee_certificates ${where}`,
    [today, addDays(today, days), ...(scope ? [scope] : [])],
  );
  const [{ total: users }] = await query<{ total: number }>("SELECT COUNT(*) AS total FROM users");
  const n = (v: unknown) => Number(v ?? 0);
  return {
    employees: n(row.employees),
    issued: n(row.current_certs) + n(row.earlier_certs),
    active: n(row.active),
    expired: n(row.expired),
    revoked: n(row.revoked),
    expiringSoon: n(row.expiring),
    pending: n(row.pending),
    passed: n(row.passed),
    failed: n(row.failed),
    users: n(users),
    expiringSoonDays: days,
  };
}

export type MonthPoint = { month: string; label: string; value: number };

function lastMonths(count: number, forward = false): string[] {
  const now = todayStr();
  const y = Number(now.slice(0, 4));
  const m = Number(now.slice(5, 7)) - 1;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, forward ? m + i : m - (count - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

const monthLabel = (month: string) => new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

async function monthly(user: PortalUser, column: string, months: string[], extra = ""): Promise<MonthPoint[]> {
  const scope = companyScope(user);
  const rows = await query<{ m: string; c: number }>(
    `SELECT DATE_FORMAT(${column}, '%Y-%m') AS m, COUNT(*) AS c FROM employee_certificates
     WHERE ${column} >= ? AND ${column} < ? ${extra} ${scope ? "AND company_name = ?" : ""} GROUP BY m`,
    [`${months[0]}-01`, addDays(`${months[months.length - 1]}-28`, 7).slice(0, 7) + "-01", ...(scope ? [scope] : [])],
  );
  const counts = new Map(rows.map((r) => [r.m, Number(r.c)]));
  return months.map((month) => ({ month, label: monthLabel(month), value: counts.get(month) ?? 0 }));
}

export async function dashboardTrends(user: PortalUser) {
  const past = lastMonths(12);
  const [registrations, issued, expiring] = await Promise.all([
    monthly(user, "created_at", past),
    monthly(user, "certificate_issue_date", past),
    monthly(user, "certificate_expiry_date", lastMonths(12, true), "AND certificate_status = 'Active'"),
  ]);
  return { registrations, issued, expiring };
}

const EXPORT_COLUMNS: { header: string; width: number; pdfWidth: number; value: (r: EmployeeListRow) => string }[] = [
  { header: "Full Name", width: 28, pdfWidth: 118, value: (r) => r.full_name },
  { header: "Company", width: 24, pdfWidth: 96, value: (r) => r.company_name },
  { header: "Employee ID", width: 14, pdfWidth: 58, value: (r) => r.employee_id },
  { header: "Phone", width: 16, pdfWidth: 66, value: (r) => r.phone_number },
  { header: "Job Position", width: 22, pdfWidth: 80, value: (r) => r.job_position },
  { header: "Training Date", width: 13, pdfWidth: 50, value: (r) => r.training_date?.slice(0, 10) ?? "" },
  { header: "Certificate Number", width: 18, pdfWidth: 76, value: (r) => r.certificate_number ?? "" },
  { header: "Issue Date", width: 12, pdfWidth: 50, value: (r) => r.certificate_issue_date?.slice(0, 10) ?? "" },
  { header: "Expiry Date", width: 12, pdfWidth: 50, value: (r) => r.certificate_expiry_date?.slice(0, 10) ?? "" },
  { header: "Assessment", width: 12, pdfWidth: 46, value: (r) => r.assessment_result },
  { header: "Status", width: 12, pdfWidth: 44, value: (r) => r.certificate_status ?? "Not issued" },
];

export async function exportExcel(rows: EmployeeListRow[]): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  book.creator = site.name;
  const sheet = book.addWorksheet("Employees", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = EXPORT_COLUMNS.map((c) => ({ header: c.header, width: c.width }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF081B3A" } };
  sheet.autoFilter = { from: "A1", to: { row: 1, column: EXPORT_COLUMNS.length } };
  // A value starting with = + - @ would run as a formula when opened in a spreadsheet.
  const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
  for (const r of rows) sheet.addRow(EXPORT_COLUMNS.map((c) => safe(c.value(r))));
  return Buffer.from(await book.xlsx.writeBuffer());
}

export async function exportPdf(rows: EmployeeListRow[], subtitle: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 841.89, H = 595.28, M = 30, ROW = 16;
  const navy = rgb(8 / 255, 27 / 255, 58 / 255);
  const line = rgb(226 / 255, 233 / 255, 244 / 255);
  // Stored text is limited to these fonts for printed fields; anything else (older data) is replaced, not fatal.
  const clean = (s: string) => s.replace(/[^ -~ -ÿ]/g, "?");
  const clip = (s: string, w: number) => {
    let t = clean(s);
    while (t && font.widthOfTextAtSize(t, 7.5) > w - 5) t = t.slice(0, -1);
    return t;
  };
  let page = doc.addPage([W, H]);
  let y = 0;
  let pageNo = 0;
  const header = () => {
    pageNo++;
    page.drawText(`${site.name}: employee and certificate report`, { x: M, y: H - 40, size: 13, font: bold, color: navy });
    page.drawText(clean(subtitle), { x: M, y: H - 54, size: 8, font, color: navy });
    page.drawText(`Page ${pageNo}`, { x: W - M - 40, y: H - 40, size: 8, font, color: navy });
    y = H - 76;
    page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: ROW, color: navy });
    let x = M + 3;
    for (const c of EXPORT_COLUMNS) {
      page.drawText(c.header === "Certificate Number" ? "Certificate No." : c.header, { x, y: y + 1, size: 7.5, font: bold, color: rgb(1, 1, 1) });
      x += c.pdfWidth;
    }
    y -= ROW;
  };
  header();
  for (const r of rows) {
    if (y < M + ROW) {
      page = doc.addPage([W, H]);
      header();
    }
    let x = M + 3;
    for (const c of EXPORT_COLUMNS) {
      page.drawText(clip(c.value(r), c.pdfWidth), { x, y: y + 1, size: 7.5, font, color: navy });
      x += c.pdfWidth;
    }
    page.drawLine({ start: { x: M, y: y - 4 }, end: { x: W - M, y: y - 4 }, thickness: 0.4, color: line });
    y -= ROW;
  }
  if (!rows.length) page.drawText("No records match these filters.", { x: M, y, size: 9, font, color: navy });
  return doc.save();
}

export const reportDateLabel = () => `Generated ${formatDate(todayStr())}`;

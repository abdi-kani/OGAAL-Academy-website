import { ApiError, portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { todayStr } from "@/lib/portal/dates";
import { exportEmployees, parseFilters } from "@/lib/portal/employees";
import { exportExcel, exportPdf, reportDateLabel } from "@/lib/portal/reports";
import { getSettings } from "@/lib/portal/settings";

export const runtime = "nodejs";

export const GET = portalRoute({ permission: "reports.view" }, async ({ req, user, ip }) => {
  const params = new URL(req.url).searchParams;
  const format = params.get("format");
  if (format !== "xlsx" && format !== "pdf") throw new ApiError(400, "Choose xlsx or pdf.");
  const filters = parseFilters(params, { sort: "full_name", dir: "asc" });
  const { expiring_soon_days: days } = await getSettings();
  // Same query as the on-screen list, including company scoping.
  const limit = format === "pdf" ? 5000 : 20000;
  const rows = await exportEmployees(user, filters, days, limit);
  await audit({ userId: user.id, action: "report.export", recordType: "report", details: { format, rows: rows.length }, ip });
  const name = `ogaal-report-${todayStr()}.${format}`;
  const headers = { "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" };
  if (format === "xlsx") {
    const data = await exportExcel(rows);
    return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } });
  }
  const data = await exportPdf(rows, `${reportDateLabel()}. ${rows.length} record(s)${rows.length === limit ? `, stopped at the ${limit}-row limit: use Excel or narrow the filters` : ""}.`);
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Type": "application/pdf" } });
});

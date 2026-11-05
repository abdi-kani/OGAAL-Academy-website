import { ApiError, parseId, portalRoute } from "@/lib/portal/api";
import { getEmployee } from "@/lib/portal/employees";
import { imageResponse, readFile } from "@/lib/portal/storage";

export const runtime = "nodejs";

export const GET = portalRoute<{ id: string }>({ permission: "employees.view" }, async ({ user, params }) => {
  const row = await getEmployee(user, parseId(params.id));
  const data = row?.employee_photo ? await readFile(row.employee_photo) : null;
  if (!row?.employee_photo || !data) throw new ApiError(404, "No photo.");
  return imageResponse(data, row.employee_photo);
});

import { ApiError, adminRoute } from "@/lib/admin/api";
import { getEmployee } from "@/lib/admin/employees";
import { imageResponse, readImage } from "@/lib/admin/images";

export const runtime = "nodejs";

export const GET = adminRoute<{ id: string }>(async ({ req, params }) => {
  const photo = (await getEmployee(params.id))?.employeePhoto;
  if (!photo) throw new ApiError(404, "No photo.");
  return imageResponse(req, photo, () => readImage(photo));
});

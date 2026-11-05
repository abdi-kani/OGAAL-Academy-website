import { ApiError, parseId, portalRoute } from "@/lib/portal/api";
import { queryOne } from "@/lib/portal/db";
import { imageResponse, readFile } from "@/lib/portal/storage";

export const runtime = "nodejs";

export const GET = portalRoute<{ id: string }>({ permission: "users.manage" }, async ({ params }) => {
  const row = await queryOne<{ profile_photo: string | null }>("SELECT profile_photo FROM users WHERE id = ?", [parseId(params.id)]);
  const data = row?.profile_photo ? await readFile(row.profile_photo) : null;
  if (!row?.profile_photo || !data) throw new ApiError(404, "No photo.");
  return imageResponse(data, row.profile_photo);
});

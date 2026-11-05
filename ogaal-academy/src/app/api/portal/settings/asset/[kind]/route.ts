import { ApiError, portalRoute } from "@/lib/portal/api";
import { getSettings } from "@/lib/portal/settings";
import { imageResponse, readFile } from "@/lib/portal/storage";

export const runtime = "nodejs";

export const GET = portalRoute<{ kind: string }>({ permission: "settings.manage" }, async ({ params }) => {
  const settings = await getSettings();
  const path = { signature: settings.signature_path, stamp: settings.stamp_path, logo: settings.logo_path }[params.kind];
  const data = path ? await readFile(path) : null;
  if (!path || !data) throw new ApiError(404, "Not uploaded.");
  return imageResponse(data, path);
});

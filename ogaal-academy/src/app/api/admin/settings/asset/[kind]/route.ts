import { ApiError, adminRoute } from "@/lib/admin/api";
import { imageResponse, readImage } from "@/lib/admin/images";
import { getSettings } from "@/lib/admin/settings";

export const runtime = "nodejs";

export const GET = adminRoute<{ kind: string }>(async ({ req, params }) => {
  const settings = await getSettings();
  const path = params.kind === "signature" ? settings.signatureAsset : params.kind === "seal" ? settings.sealAsset : null;
  if (!path) throw new ApiError(404, "Not found.");
  return imageResponse(req, path, () => readImage(path));
});

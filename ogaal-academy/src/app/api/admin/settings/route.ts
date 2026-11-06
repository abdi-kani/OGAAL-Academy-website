import { NextResponse } from "next/server";
import { ApiError, adminRoute } from "@/lib/admin/api";
import { audit } from "@/lib/admin/audit";
import { fail, printableProblem } from "@/lib/admin/employees";
import { MAX_ASSET_BYTES, storeImage, uploadedFile } from "@/lib/admin/images";
import { updateSettings } from "@/lib/admin/settings";

export const runtime = "nodejs";

export const POST = adminRoute(async ({ req, admin, ip }) => {
  const form = await req.formData().catch(() => {
    throw new ApiError(400, "Invalid request.");
  });
  const errors: Record<string, string> = {};
  const value = (key: string, max: number) => {
    const raw = form.get(key);
    const v = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
    const problem = v.length > max ? `Use ${max} characters or fewer.` : printableProblem(v);
    if (problem) errors[key] = problem;
    return v;
  };
  const signatoryName = value("signatoryName", 120);
  const signatoryTitle = value("signatoryTitle", 120);
  const trainingTitle = value("trainingTitle", 150);
  if (!trainingTitle) errors.trainingTitle = "Training title is required.";
  if (Object.keys(errors).length) fail(errors);

  const asset = async (field: string) => {
    const file = uploadedFile(form.get(field));
    return file ? storeImage(file, { folder: "settings-assets", prefix: field, maxWidth: 1200, maxHeight: 800, format: "png", field, maxBytes: MAX_ASSET_BYTES }) : null;
  };
  const signature = await asset("signature");
  const seal = await asset("seal");
  // Earlier signature files stay in storage: certificates already issued still point at them.
  await updateSettings((s) => {
    Object.assign(s, { signatoryName, signatoryTitle, trainingTitle });
    if (signature) s.signatureAsset = signature;
    if (seal) s.sealAsset = seal;
  });
  await audit(admin.username, "settings.update", ip);
  return NextResponse.json({ ok: true });
});

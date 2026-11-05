import { NextResponse } from "next/server";
import { portalRoute } from "@/lib/portal/api";
import { audit } from "@/lib/portal/audit";
import { getSettings, setSetting } from "@/lib/portal/settings";
import { removeFile, saveImage, uploadedFile } from "@/lib/portal/storage";
import { fail } from "@/lib/portal/validation";

export const runtime = "nodejs";

const IMAGES = [
  { field: "signature", key: "signature_path", folder: "signatures", maxWidth: 800, maxHeight: 300, keepOld: true },
  { field: "stamp", key: "stamp_path", folder: "stamps", maxWidth: 600, maxHeight: 600, keepOld: false },
  { field: "logo", key: "logo_path", folder: "logos", maxWidth: 800, maxHeight: 800, keepOld: false },
] as const;

export const POST = portalRoute({ permission: "settings.manage" }, async ({ req, user, ip }) => {
  const form = await req.formData();
  const text = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  const days = Number(text("expiring_soon_days"));
  const signatory = text("signatory_name");
  if (!Number.isInteger(days) || days < 1 || days > 365) fail({ expiring_soon_days: "Enter a number of days from 1 to 365." });
  if (signatory.length > 150 || !/^[ -~ -ÿ]*$/.test(signatory)) fail({ signatory_name: "Use up to 150 Latin characters." });
  const questions = text("assessment_questions").split(/\r?\n/).map((q) => q.trim()).filter(Boolean);
  if (questions.length > 30 || questions.some((q) => q.length > 500)) fail({ assessment_questions: "Use up to 30 questions of up to 500 characters each." });

  const current = await getSettings();
  const changedImages: string[] = [];
  for (const image of IMAGES) {
    const file = uploadedFile(form.get(image.field));
    if (!file) continue;
    const path = await saveImage(file, { folder: image.folder, maxWidth: image.maxWidth, maxHeight: image.maxHeight, format: "png", field: image.field });
    await setSetting(image.key, path);
    // Issued certificates keep pointing at the signature they were issued with, so old signature files stay.
    if (!image.keepOld) await removeFile(current[image.key]);
    changedImages.push(image.field);
  }
  await setSetting("signatory_name", signatory);
  await setSetting("expiring_soon_days", String(days));
  await setSetting("show_photo_on_certificate", form.get("show_photo_on_certificate") === "on" ? "1" : "0");
  await setSetting("show_assessment_on_certificate", form.get("show_assessment_on_certificate") === "on" ? "1" : "0");
  await setSetting("assessment_questions", JSON.stringify(questions));
  await audit({ userId: user.id, action: "settings.update", recordType: "settings", details: { images: changedImages }, ip });
  return NextResponse.json({ ok: true });
});

import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ApiError } from "./api";

/**
 * Private file storage. Files live in STORAGE_DIR, outside /public and outside Git, and reach users only
 * through permission-checked API routes. The database stores paths relative to STORAGE_DIR.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_INPUT = new Set(["jpeg", "png", "webp"]);

function root(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_DIR || "storage");
}

function resolveSafe(relative: string): string {
  const base = root();
  const full = path.resolve(/*turbopackIgnore: true*/ base, relative);
  if (full !== base && !full.startsWith(base + path.sep)) throw new Error("Path escapes storage directory");
  return full;
}

export async function writeFile(folder: string, extension: string, data: Buffer | Uint8Array, nameHint = ""): Promise<string> {
  const safeHint = nameHint.replace(/[^A-Za-z0-9-]/g, "");
  const relative = path.posix.join(folder, `${safeHint ? `${safeHint}-` : ""}${crypto.randomUUID()}.${extension}`);
  const full = resolveSafe(relative);
  await fs.mkdir(path.dirname(full), { recursive: true, mode: 0o700 });
  const temp = `${full}.tmp`;
  await fs.writeFile(temp, data, { mode: 0o600 });
  await fs.rename(temp, full);
  return relative;
}

export async function readFile(relative: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(resolveSafe(relative));
  } catch {
    return null;
  }
}

export async function removeFile(relative: string | null | undefined): Promise<void> {
  if (!relative) return;
  await fs.rm(resolveSafe(relative), { force: true }).catch(() => {});
}

/**
 * Validates by decoding the actual image, not by trusting its name or declared type, then re-encodes it.
 * Re-encoding drops metadata (including GPS location) and anything hidden in the original file.
 */
export async function saveImage(
  file: File,
  opts: { folder: string; maxWidth: number; maxHeight: number; format: "jpeg" | "png"; field: string },
): Promise<string> {
  const invalid = (message: string) => new ApiError(422, message, { [opts.field]: message });
  if (file.size > MAX_UPLOAD_BYTES) throw invalid("The image must be 5 MB or smaller.");
  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000 });
    const meta = await image.metadata();
    if (!meta.format || !ALLOWED_INPUT.has(meta.format)) throw new Error("format");
    const resized = image.rotate().resize({ width: opts.maxWidth, height: opts.maxHeight, fit: "inside", withoutEnlargement: true });
    output = opts.format === "png" ? await resized.png().toBuffer() : await resized.flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
  } catch {
    throw invalid("Upload a JPG, PNG or WebP image.");
  }
  return writeFile(opts.folder, opts.format === "png" ? "png" : "jpg", output);
}

export const uploadedFile = (value: FormDataEntryValue | null): File | null => (value instanceof File && value.size > 0 ? value : null);

export function imageResponse(data: Buffer, relative: string): Response {
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": relative.endsWith(".png") ? "image/png" : "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

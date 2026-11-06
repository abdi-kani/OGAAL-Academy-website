import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";
import { ApiError } from "./api";
import { ConflictError, deleteFile, getFile, putFile } from "./github";
import { decrypt, encrypt } from "./store";

/** Vercel rejects request bodies over 4.5 MB, so limits stay below that. */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const MAX_ASSET_BYTES = 2 * 1024 * 1024;
const ALLOWED_INPUT = new Set(["jpeg", "png", "webp"]);
const KIND = "image";

type Options = { folder: string; prefix?: string; maxWidth: number; maxHeight: number; format: "jpeg" | "png"; field: string; maxBytes: number };

/**
 * Validates by decoding the actual image, not by trusting its name or declared type, then re-encodes it.
 * Re-encoding drops metadata (including GPS location) and anything hidden in the original file.
 */
export async function storeImage(file: File, opts: Options): Promise<string> {
  const invalid = (message: string) => new ApiError(422, message, { [opts.field]: message });
  if (file.size > opts.maxBytes) throw invalid(`The image must be ${opts.maxBytes / (1024 * 1024)} MB or smaller.`);
  let output: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 });
    const meta = await image.metadata();
    if (!meta.format || !ALLOWED_INPUT.has(meta.format)) throw new Error("format");
    const resized = image.rotate().resize({ width: opts.maxWidth, height: opts.maxHeight, fit: "inside", withoutEnlargement: true });
    output = opts.format === "png" ? await resized.png().toBuffer() : await resized.flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer();
  } catch {
    throw invalid("Upload a JPG, PNG or WebP image.");
  }
  // The name is random and reveals nothing about the employee.
  const path = `${opts.folder}/${opts.prefix ? `${opts.prefix}-` : ""}${crypto.randomUUID()}.${opts.format === "png" ? "png" : "jpg"}.enc`;
  await putFile(path, encrypt(output, KIND), "Store encrypted file");
  return path;
}

export async function readImage(path: string): Promise<Buffer | null> {
  const result = await getFile(path);
  return result.status === "ok" ? decrypt(result.data, KIND) : null;
}

/** Best effort: a leftover encrypted file is harmless, and must not fail the action that caused it. */
export async function removeImage(path: string | null | undefined): Promise<void> {
  if (!path) return;
  try {
    await deleteFile(path, "Remove encrypted file");
  } catch (err) {
    if (!(err instanceof ConflictError)) console.error("Could not remove stored image:", (err as Error).message);
  }
}

export const uploadedFile = (value: FormDataEntryValue | null): File | null => (value instanceof File && value.size > 0 ? value : null);

/** Stored names never change content, so the browser may reuse its copy, but only after the session check has passed. */
export function imageResponse(req: Request, path: string, load: () => Promise<Buffer | null>): Promise<Response> | Response {
  const etag = `"${crypto.createHash("sha256").update(path).digest("base64url").slice(0, 24)}"`;
  const headers = { "Cache-Control": "private, no-cache", ETag: etag, "X-Content-Type-Options": "nosniff" };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return load().then((data) => {
    if (!data) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Type": path.includes(".png.") ? "image/png" : "image/jpeg" } });
  });
}

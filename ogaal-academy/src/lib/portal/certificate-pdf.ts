import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/seo";
import { formatDate } from "./dates";
import type { EmployeeRow } from "./employees";
import type { PortalSettings } from "./settings";
import { readFile } from "./storage";

const NAVY = rgb(8 / 255, 27 / 255, 58 / 255);
const BLUE = rgb(7 / 255, 85 / 255, 233 / 255);
const BODY = rgb(83 / 255, 98 / 255, 122 / 255);
const LINE = rgb(200 / 255, 212 / 255, 232 / 255);
const WIDTH = 841.89;
const HEIGHT = 595.28;

export function portalBaseUrl(): string {
  return (process.env.PORTAL_BASE_URL || siteUrl).replace(/\/$/, "");
}

export function verificationUrl(token: string): string {
  return `${portalBaseUrl()}/verify/c/${token}`;
}

async function embed(doc: PDFDocument, data: Buffer | null, relative: string): Promise<PDFImage | null> {
  if (!data) return null;
  return relative.endsWith(".png") ? doc.embedPng(data) : doc.embedJpg(data);
}

function centred(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = NAVY, cx = WIDTH / 2) {
  page.drawText(text, { x: cx - font.widthOfTextAtSize(text, size) / 2, y, size, font, color });
}

/** Largest size up to `size` at which the text fits on one line. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number, min = 9): number {
  let s = size;
  while (s > min && font.widthOfTextAtSize(text, s) > maxWidth) s -= 0.5;
  return s;
}

function contain(image: PDFImage, maxW: number, maxH: number) {
  const scale = Math.min(maxW / image.width, maxH / image.height);
  return { width: image.width * scale, height: image.height * scale };
}

/**
 * The printable certificate: A4 landscape. Only the fields below reach the page.
 * Phone number, date of birth, blood group and assessment remarks are deliberately never read here.
 */
export async function renderCertificatePdf(row: EmployeeRow, settings: PortalSettings): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate ${row.certificate_number}`);
  doc.setAuthor(site.fullName);
  doc.setCreator(site.name);
  const page = doc.addPage([WIDTH, HEIGHT]);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Frame
  page.drawRectangle({ x: 18, y: 18, width: WIDTH - 36, height: HEIGHT - 36, borderColor: NAVY, borderWidth: 3 });
  page.drawRectangle({ x: 26, y: 26, width: WIDTH - 52, height: HEIGHT - 52, borderColor: BLUE, borderWidth: 0.75 });
  for (const [x, y] of [[26, 26], [WIDTH - 26, 26], [26, HEIGHT - 26], [WIDTH - 26, HEIGHT - 26]]) {
    page.drawRectangle({ x: x - 7, y: y - 7, width: 14, height: 14, color: NAVY, rotate: degrees(0) });
    page.drawRectangle({ x: x - 3, y: y - 3, width: 6, height: 6, color: rgb(1, 1, 1) });
  }

  // Logo, with a faint copy as a watermark
  const logoFile = settings.logo_path || null;
  const logo = logoFile
    ? await embed(doc, await readFile(logoFile), logoFile)
    : await doc.embedPng(await fs.readFile(path.join(process.cwd(), "public", site.logo.full.src)));
  if (logo) {
    const mark = contain(logo, 300, 300);
    page.drawImage(logo, { x: (WIDTH - mark.width) / 2, y: 150, ...mark, opacity: 0.045 });
    const top = contain(logo, 80, 74);
    page.drawImage(logo, { x: (WIDTH - top.width) / 2, y: 496, ...top });
  }

  centred(page, site.fullName.toUpperCase(), 480, sansBold, fit(site.fullName.toUpperCase(), sansBold, 10.5, 520), NAVY);
  centred(page, "Certificate of Training", 438, serifBold, 36, NAVY);
  centred(page, "OGAAL Firearms Safety Training Certificate", 418, sans, 11, BLUE);

  centred(page, "This certifies that", 388, serifItalic, 14, BODY);
  const nameSize = fit(row.full_name, serifBold, 30, 500, 16);
  centred(page, row.full_name, 355, serifBold, nameSize, BLUE);
  page.drawLine({ start: { x: WIDTH / 2 - 190, y: 345 }, end: { x: WIDTH / 2 + 190, y: 345 }, thickness: 0.75, color: LINE });
  const of = `of ${row.company_name}`;
  centred(page, of, 325, serifBold, fit(of, serifBold, 14, 560), NAVY);
  centred(page, "has successfully completed the academy’s training and assessment requirements.", 306, serif, 13, BODY);

  // Photo
  if (settings.show_photo_on_certificate && row.employee_photo) {
    const photo = await embed(doc, await readFile(row.employee_photo), row.employee_photo);
    if (photo) {
      const size = contain(photo, 84, 104);
      const x = 62 + (84 - size.width) / 2;
      const y = 448 + (104 - size.height) / 2;
      page.drawImage(photo, { x, y, ...size });
      page.drawRectangle({ x: x - 2, y: y - 2, width: size.width + 4, height: size.height + 4, borderColor: NAVY, borderWidth: 1 });
    }
  }

  // Certificate number, top right
  const label = "CERTIFICATE NO.";
  const rightCx = WIDTH - 128;
  centred(page, label, 530, sansBold, 7.5, BODY, rightCx);
  centred(page, row.certificate_number!, 514, serifBold, 13, NAVY, rightCx);

  // Details grid
  const cells: [string, string][] = [
    ["Employee ID", row.employee_id],
    ["Job Position", row.job_position],
    ["Training Date", formatDate(row.training_date)],
    ["Issue Date", formatDate(row.certificate_issue_date)],
    ["Expiry Date", formatDate(row.certificate_expiry_date)],
  ];
  if (settings.show_assessment_on_certificate && row.assessment_approved_at) cells.push(["Assessment Result", row.assessment_result]);
  const perRow = 3;
  const cellW = 200;
  const left = (WIDTH - cellW * perRow) / 2;
  const rowsTop = 278;
  page.drawLine({ start: { x: left, y: rowsTop + 8 }, end: { x: left + cellW * perRow, y: rowsTop + 8 }, thickness: 0.75, color: LINE });
  cells.forEach(([k, v], i) => {
    const cx = left + cellW * (i % perRow) + cellW / 2;
    const y = rowsTop - 10 - Math.floor(i / perRow) * 40;
    centred(page, k.toUpperCase(), y, sansBold, 7.5, BODY, cx);
    centred(page, v, y - 16, serifBold, fit(v, serifBold, 13, cellW - 14), NAVY, cx);
  });
  page.drawLine({ start: { x: left, y: rowsTop - 72 }, end: { x: left + cellW * perRow, y: rowsTop - 72 }, thickness: 0.75, color: LINE });

  // Signature, stamp and QR code
  const footY = 92;
  const sigCx = 190;
  if (row.authorized_signature) {
    const sig = await embed(doc, await readFile(row.authorized_signature), row.authorized_signature);
    if (sig) {
      const size = contain(sig, 170, 56);
      page.drawImage(sig, { x: sigCx - size.width / 2, y: footY + 2, ...size });
    }
  }
  page.drawLine({ start: { x: sigCx - 95, y: footY }, end: { x: sigCx + 95, y: footY }, thickness: 0.75, color: NAVY });
  if (row.authorized_signatory) centred(page, row.authorized_signatory, footY - 13, serifBold, fit(row.authorized_signatory, serifBold, 11, 190), NAVY, sigCx);
  centred(page, "Authorized Signature", footY - (row.authorized_signatory ? 25 : 13), sans, 8, BODY, sigCx);

  const stampCx = WIDTH / 2;
  const stampCy = footY + 22;
  if (settings.stamp_path) {
    const stamp = await embed(doc, await readFile(settings.stamp_path), settings.stamp_path);
    if (stamp) {
      const size = contain(stamp, 96, 96);
      page.drawImage(stamp, { x: stampCx - size.width / 2, y: stampCy - size.height / 2, ...size });
    }
  } else {
    // No stamp uploaded: leave a marked space for a physical stamp. A stamp is never invented.
    page.drawCircle({ x: stampCx, y: stampCy, size: 44, borderColor: LINE, borderWidth: 1, borderDashArray: [3, 3] });
    centred(page, "Official Stamp", stampCy - 3, sans, 8, BODY, stampCx);
  }

  const qr = await doc.embedPng(await QRCode.toBuffer(verificationUrl(row.verification_token!), { type: "png", width: 360, margin: 1, errorCorrectionLevel: "M", color: { dark: "#081B3A", light: "#FFFFFF" } }));
  const qrCx = WIDTH - 190;
  page.drawImage(qr, { x: qrCx - 40, y: footY - 8, width: 80, height: 80 });
  centred(page, "Scan to verify this certificate", footY - 20, sans, 8, BODY, qrCx);

  centred(page, "This certificate does not replace a firearm licence, permit, or other authorisation required by law.", 38, sans, 8, BODY);

  return doc.save();
}

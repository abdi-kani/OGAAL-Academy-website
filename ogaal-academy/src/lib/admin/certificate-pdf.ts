import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { site } from "@/content/site";
import { formatDate } from "./dates";
import type { EmployeeRecord } from "./employees";
import { readImage } from "./images";
import type { AdminSettings } from "./settings";

const NAVY = rgb(8 / 255, 27 / 255, 58 / 255);
const BLUE = rgb(7 / 255, 85 / 255, 233 / 255);
const BODY = rgb(83 / 255, 98 / 255, 122 / 255);
const LINE = rgb(200 / 255, 212 / 255, 232 / 255);
const WIDTH = 841.89;
const HEIGHT = 595.28;

async function embedStored(doc: PDFDocument, file: string | null | undefined): Promise<PDFImage | null> {
  if (!file) return null;
  const data = await readImage(file);
  if (!data) return null;
  return file.includes(".png.") ? doc.embedPng(data) : doc.embedJpg(data);
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
 * Phone number, blood group, date of birth and assessment details are deliberately never read here.
 */
export async function renderCertificatePdf(row: EmployeeRecord, settings: AdminSettings): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate ${row.certificateNumber}`);
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
    page.drawRectangle({ x: x - 7, y: y - 7, width: 14, height: 14, color: NAVY });
    page.drawRectangle({ x: x - 3, y: y - 3, width: 6, height: 6, color: rgb(1, 1, 1) });
  }

  // Logo, with a faint copy as a watermark
  const logo = await doc.embedPng(await fs.readFile(path.join(process.cwd(), "public", site.logo.full.src)));
  const mark = contain(logo, 300, 300);
  page.drawImage(logo, { x: (WIDTH - mark.width) / 2, y: 150, ...mark, opacity: 0.045 });
  const top = contain(logo, 80, 74);
  page.drawImage(logo, { x: (WIDTH - top.width) / 2, y: 496, ...top });

  centred(page, site.fullName.toUpperCase(), 480, sansBold, fit(site.fullName.toUpperCase(), sansBold, 10.5, 520), NAVY);
  centred(page, "Certificate of Training", 438, serifBold, 36, NAVY);

  centred(page, "This certifies that", 405, serifItalic, 14, BODY);
  centred(page, row.fullName, 370, serifBold, fit(row.fullName, serifBold, 30, 500, 16), BLUE);
  page.drawLine({ start: { x: WIDTH / 2 - 190, y: 360 }, end: { x: WIDTH / 2 + 190, y: 360 }, thickness: 0.75, color: LINE });
  const of = `of ${row.companyName}`;
  centred(page, of, 340, serifBold, fit(of, serifBold, 14, 560), NAVY);
  centred(page, "has successfully completed the training", 320, serif, 13, BODY);
  centred(page, settings.trainingTitle, 298, serifBold, fit(settings.trainingTitle, serifBold, 17, 600), NAVY);

  // Certificate number, top right
  const rightCx = WIDTH - 128;
  centred(page, "CERTIFICATE NO.", 530, sansBold, 7.5, BODY, rightCx);
  centred(page, row.certificateNumber!, 514, serifBold, 13, NAVY, rightCx);

  // Details
  const cells: [string, string][] = [
    ["Employee ID", row.employeeId],
    ["Training Date", formatDate(row.trainingDate)],
    ["Issue Date", formatDate(row.certificateIssueDate)],
    ["Expiry Date", formatDate(row.certificateExpiryDate)],
  ];
  const cellW = 160;
  const left = (WIDTH - cellW * cells.length) / 2;
  const rowsTop = 278;
  page.drawLine({ start: { x: left, y: rowsTop }, end: { x: left + cellW * cells.length, y: rowsTop }, thickness: 0.75, color: LINE });
  cells.forEach(([k, v], i) => {
    const cx = left + cellW * i + cellW / 2;
    centred(page, k.toUpperCase(), rowsTop - 18, sansBold, 7.5, BODY, cx);
    centred(page, v, rowsTop - 34, serifBold, fit(v, serifBold, 13, cellW - 14), NAVY, cx);
  });
  page.drawLine({ start: { x: left, y: rowsTop - 46 }, end: { x: left + cellW * cells.length, y: rowsTop - 46 }, thickness: 0.75, color: LINE });

  // Signature and seal. Neither is ever invented: without an upload, the space is left to sign and stamp by hand.
  const footY = 100;
  const sigCx = 240;
  const signatory = row.authorizedSignature ?? { name: settings.signatoryName, title: settings.signatoryTitle, asset: settings.signatureAsset };
  const signature = await embedStored(doc, signatory.asset);
  if (signature) {
    const size = contain(signature, 170, 56);
    page.drawImage(signature, { x: sigCx - size.width / 2, y: footY + 2, ...size });
  }
  page.drawLine({ start: { x: sigCx - 95, y: footY }, end: { x: sigCx + 95, y: footY }, thickness: 0.75, color: NAVY });
  let lineY = footY - 13;
  if (signatory.name) {
    centred(page, signatory.name, lineY, serifBold, fit(signatory.name, serifBold, 11, 190), NAVY, sigCx);
    lineY -= 12;
  }
  centred(page, signatory.title || "Authorized Signature", lineY, sans, 8, BODY, sigCx);

  const sealCx = WIDTH - 240;
  const sealCy = footY + 18;
  const seal = await embedStored(doc, settings.sealAsset);
  if (seal) {
    const size = contain(seal, 100, 100);
    page.drawImage(seal, { x: sealCx - size.width / 2, y: sealCy - size.height / 2, ...size });
  } else {
    page.drawCircle({ x: sealCx, y: sealCy, size: 44, borderColor: LINE, borderWidth: 1, borderDashArray: [3, 3] });
    centred(page, "Academy Seal", sealCy - 3, sans, 8, BODY, sealCx);
  }

  centred(page, "This certificate does not replace a firearm licence, permit, or other authorisation required by law.", 38, sans, 8, BODY);

  return doc.save();
}

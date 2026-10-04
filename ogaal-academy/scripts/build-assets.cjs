// Prepares web assets from the OFFICIAL OGAAL logo (brand/official/ogaal-logo-source.jpg,
// extracted unchanged from OGAAL_Logo_Only.pdf). The artwork itself is not altered:
// only the outer white background is made transparent and the shield mark is cropped.
// Usage: node scripts/build-assets.cjs   (run with the production server on :3100 for the OG image)
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const SRC = path.join(root, "brand/official/ogaal-logo-source.jpg");
const PUB = path.join(root, "public/brand");
const APP = path.join(root, "src/app");
fs.mkdirSync(PUB, { recursive: true });

/** Flood-fill near-white pixels connected to the image border → transparent. */
async function removeOuterWhite(input, tol = 18) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const seen = new Uint8Array(w * h);
  const isWhite = (i) => data[i * 4] > 255 - tol && data[i * 4 + 1] > 255 - tol && data[i * 4 + 2] > 255 - tol;
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !isWhite(i)) continue;
    seen[i] = 1;
    data[i * 4 + 3] = 0;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  // soften the 1px fringe next to removed pixels
  for (let i = 0; i < w * h; i++) {
    if (seen[i]) continue;
    const x = i % w, y = (i / w) | 0;
    const n = [i - 1, i + 1, i - w, i + w].filter((j, k) => (k === 0 ? x > 0 : k === 1 ? x < w - 1 : k === 2 ? y > 0 : y < h - 1));
    if (n.some((j) => seen[j]) && isWhite(i) === false) {
      const lum = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
      if (lum > 200) data[i * 4 + 3] = Math.round(255 * (1 - (lum - 200) / 55) * 0.9 + 25);
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png();
}

(async () => {
  // Full official logo (stacked), transparent outer background, trimmed
  const full = await (await removeOuterWhite(SRC)).toBuffer();
  const fullTrim = await sharp(full).trim({ threshold: 1 }).png().toBuffer();
  const fm = await sharp(fullTrim).metadata();
  fs.writeFileSync(path.join(PUB, "ogaal-logo.png"), fullTrim);
  await sharp(fullTrim).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(PUB, "ogaal-logo.webp"));

  // Shield mark: the top part of the logo, above the OGAAL wordmark
  // find the first fully transparent row below the shield (gap between shield and wordmark)
  const { data: px } = await sharp(fullTrim).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let markH = Math.round(fm.height * 0.6);
  for (let y = Math.round(fm.height * 0.45); y < fm.height * 0.75; y++) {
    let empty = true;
    for (let x = 0; x < fm.width; x++) if (px[(y * fm.width + x) * 4 + 3] > 8) { empty = false; break; }
    if (empty) { markH = y; break; }
  }
  // horizontal bounds of the shield = columns with solid (alpha > 120) pixels within the mark rows
  let x0 = fm.width, x1 = 0;
  for (let y = 0; y < markH; y++) for (let x = 0; x < fm.width; x++) if (px[(y * fm.width + x) * 4 + 3] > 120) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  const mark = await sharp(fullTrim).extract({ left: x0, top: 0, width: x1 - x0 + 1, height: markH }).png().toBuffer();
  fs.writeFileSync(path.join(PUB, "ogaal-mark.png"), mark);
  const mm = await sharp(mark).metadata();

  // Favicons: mark centred on a white rounded tile (works on light and dark browser chrome)
  async function tile(size, radius, padRatio) {
    const inner = Math.round(size * (1 - padRatio * 2));
    const m = await sharp(mark).resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/></svg>`);
    return sharp(bg).composite([{ input: m, gravity: "center" }]).png().toBuffer();
  }
  fs.writeFileSync(path.join(APP, "icon.png"), await tile(512, 112, 0.08));
  fs.writeFileSync(path.join(APP, "apple-icon.png"), await tile(180, 0, 0.1));
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map(async (s) => sharp(await tile(256, 56, 0.04)).resize(s, s).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const o = 6 + i * 16;
    header.writeUInt8(s, o); header.writeUInt8(s, o + 1);
    header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(pngs[i].length, o + 8); header.writeUInt32LE(offset, o + 12);
    offset += pngs[i].length;
  });
  fs.writeFileSync(path.join(APP, "favicon.ico"), Buffer.concat([header, ...pngs]));

  console.log(`logo ${fm.width}x${fm.height}, mark ${mm.width}x${mm.height}, icons written`);
})();

// Renders the static 3D illustrations used on the site (hero artwork + small 3D icons).
// Usage: node scripts/render3d/render.cjs
// Requires Playwright's Chromium. Output: public/images/3d/*.png (+ .webp via sharp)
const http = require("http");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");

const root = path.resolve(__dirname, "../..");
const out = path.join(root, "public/images/3d");
fs.mkdirSync(out, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = url === "/" ? path.join(__dirname, "scene.html") : path.join(root, url);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

const jobs = [
  { scene: "hero", w: 1400, h: 1250, name: "hero-shield-book" },
  { scene: "shield", w: 512, h: 512, name: "icon-shield" },
  { scene: "book", w: 512, h: 512, name: "icon-book" },
  { scene: "people", w: 512, h: 512, name: "icon-people" },
];

server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.w, height: j.h } });
    page.on("pageerror", (e) => console.error(j.scene, e.message));
    await page.goto(`http://localhost:${port}/?scene=${j.scene}&w=${j.w}&h=${j.h}`);
    await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
    const dataUrl = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/png"));
    const buf = Buffer.from(dataUrl.split(",")[1], "base64");
    const trimmed = await sharp(buf).trim({ threshold: 1 }).toBuffer();
    const pad = j.scene === "hero" ? 12 : 8;
    const padded = await sharp(trimmed).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    fs.writeFileSync(path.join(out, `${j.name}.png`), padded);
    await sharp(padded).webp({ quality: 88, alphaQuality: 95 }).toFile(path.join(out, `${j.name}.webp`));
    const meta = await sharp(padded).metadata();
    console.log(j.name, meta.width + "x" + meta.height);
    await page.close();
  }
  await browser.close();
  server.close();
});

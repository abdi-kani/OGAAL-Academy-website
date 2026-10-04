// Renders the 1200×630 social sharing image (src/app/opengraph-image.png) from HTML,
// using the official logo, the 3D artwork and the site fonts.
// Usage: node scripts/build-og.cjs
const fs = require("fs");
const path = require("path");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");

const root = path.resolve(__dirname, "..");
const f = (p) => "file://" + path.join(root, p);
const font = (pkg, file) => f(`node_modules/@fontsource-variable/${pkg}/files/${file}`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Manrope;src:url(${font("manrope", "manrope-latin-wght-normal.woff2")}) format("woff2");font-weight:200 800}
@font-face{font-family:Inter;src:url(${font("inter", "inter-latin-wght-normal.woff2")}) format("woff2");font-weight:100 900}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{font-family:Inter,sans-serif;color:#081B3A;background:
 radial-gradient(700px 420px at 78% 40%, #d6e4fd, transparent 65%),
 linear-gradient(180deg,#f7f9fe,#eaf1fe);position:relative}
.logo{position:absolute;left:72px;top:56px;display:flex;align-items:center;gap:16px}
.logo img{height:84px}
.logo b{font-family:Manrope;font-weight:800;font-size:40px;color:#0755E9;letter-spacing:-.02em;display:block;line-height:1}
.logo span{font-family:Manrope;font-weight:800;font-size:13px;letter-spacing:.02em;text-transform:uppercase;display:block;margin-top:6px;max-width:250px;line-height:1.25}
h1{position:absolute;left:72px;top:200px;margin:0;font-family:Manrope;font-weight:800;font-size:58px;line-height:1.06;letter-spacing:-.045em}
h1 em{font-style:normal;color:#0755E9;display:block}
p{position:absolute;left:72px;top:375px;margin:0;font-size:24px;color:#53627A;max-width:520px;line-height:1.4}
.loc{position:absolute;left:72px;bottom:56px;display:flex;align-items:center;gap:10px;font-family:Manrope;font-weight:700;font-size:20px}
.loc i{width:36px;height:4px;border-radius:4px;background:#0755E9;display:block}
.art{position:absolute;right:24px;top:70px;width:470px}
</style></head><body>
<div class="logo"><img src="${f("public/brand/ogaal-mark.png")}"><div><b>OGAAL</b><span>Firearms Safety &amp; Responsibility Training Academy</span></div></div>
<h1>Safety First.<em>Responsibility Always.</em></h1>
<p>Professional safety education. Responsible ownership. Safer communities.</p>
<div class="loc"><i></i>Mogadishu, Somalia</div>
<img class="art" src="${f("public/images/3d/hero-shield-book.png")}">
</body></html>`;

(async () => {
  const tmp = path.join(root, "scripts/.og.html");
  fs.writeFileSync(tmp, html);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto("file://" + tmp);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(root, "src/app/opengraph-image.png") });
  await b.close();
  fs.unlinkSync(tmp);
  console.log("opengraph-image.png written");
})();

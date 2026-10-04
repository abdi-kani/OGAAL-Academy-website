// Builds a single-file, shareable preview of the site from the running production server.
// Usage: npm run build && npm start -- -p 3100, then: node scripts/build-preview.cjs <out.html>
const fs = require("fs");
const path = require("path");
const { chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright");

const root = path.resolve(__dirname, "..");
const BASE = "http://localhost:3100";
const pages = [
  ["home", "/"],
  ["about", "/about"],
  ["training", "/training"],
  ["admissions", "/admissions"],
  ["certification", "/certification"],
  ["faq", "/faq"],
  ["contact", "/contact"],
];

const mime = { ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const dataUri = (publicPath) => {
  const file = path.join(root, "public", publicPath);
  return `data:${mime[path.extname(file)]};base64,${fs.readFileSync(file).toString("base64")}`;
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const blocks = [];
  const faqData = {};
  for (const [key, url] of pages) {
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.goto(BASE + url, { waitUntil: "networkidle" });
    // Collect accordion answers (panels are only in the DOM while open)
    const btns = p.locator('main button[aria-controls][aria-expanded]');
    const n = await btns.count();
    for (let i = 0; i < n; i++) {
      const q = (await btns.nth(i).innerText()).trim();
      if ((await btns.nth(i).getAttribute("aria-expanded")) !== "true") await btns.nth(i).click();
      await p.waitForTimeout(80);
      const id = await btns.nth(i).getAttribute("aria-controls");
      faqData[q] = (await p.locator(`[id="${id}"]`).innerText()).trim();
    }
    if (n) {
      await btns.nth(n - 1).click(); // close last
      await btns.nth(0).click(); // reopen first (default state)
      await p.waitForTimeout(100);
    }
    let html = await p.evaluate(() => ["header", "main", "footer"].map((t) => document.querySelector("body > " + t).outerHTML).join("\n"));
    // Capture the open mobile menu for this page and keep it hidden in the header
    await p.setViewportSize({ width: 390, height: 844 });
    await p.click('button[aria-controls="mobile-menu"]');
    await p.waitForSelector("#mobile-menu");
    const menu = await p.evaluate(() => document.getElementById("mobile-menu").outerHTML.replace(/\sstyle="[^"]*"/, ""));
    html = html.replace("</header>", menu.replace('id="mobile-menu"', 'id="mobile-menu" hidden') + "</header>");
    blocks.push(`<div class="pv-page" data-page="${key}"${key === "home" ? "" : " hidden"}>\n${html}\n</div>`);
  }
  await b.close();

  let body = blocks.join("\n");
  // Inline images served through Next.js image optimisation or from /public
  body = body.replace(/\ssrcset="[^"]*"/g, "");
  body = body.replace(/src="\/_next\/image\?url=([^&"]+)[^"]*"/g, (_, enc) => `src="${dataUri(decodeURIComponent(enc))}"`);
  body = body.replace(/src="(\/(?:brand|images)\/[^"]+)"/g, (_, p1) => `src="${dataUri(p1)}"`);
  body = body.replace(/\s(data-nimg|fetchpriority|decoding)="[^"]*"/g, "");

  const cssFiles = fs.readdirSync(path.join(root, ".next/static/chunks")).filter((f) => f.endsWith(".css"));
  let css = cssFiles.map((f) => fs.readFileSync(path.join(root, ".next/static/chunks", f), "utf8")).join("\n");
  css = css.replace(/@font-face\{[^}]*\}/g, "");

  const js = fs.readFileSync(path.join(__dirname, "preview-runtime.js"), "utf8").replace("__FAQ_DATA__", JSON.stringify(faqData));

  const out = `<title>OGAAL Academy Website</title>
<meta name="description" content="OGAAL Firearms Safety and Responsibility Training Academy — website preview.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Manrope:wght@500..800&family=Fraunces:opsz,wght@9..144,500..700&display=swap">
<style>
${css}
/* Preview overrides: Google-hosted fonts, explicit light theme, safe-area aware sticky header */
:root{--font-display:"Manrope",system-ui,sans-serif;--font-sans:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--font-serif:"Fraunces",Georgia,serif;color-scheme:light}
html,body{background:#fff;color:#53627a}
body{font-family:var(--font-sans)}
header.sticky{top:env(safe-area-inset-top,0px)}
.pv-page{display:flex;flex-direction:column;min-height:100dvh}
.pv-page>main{flex:1}
</style>
${body}
<script>
${js}
</script>
`;
  fs.writeFileSync(process.argv[2], out);
  console.log("Preview written:", process.argv[2], (out.length / 1024).toFixed(0) + " KB", Object.keys(faqData).length, "FAQ answers");
})();

#!/usr/bin/env node
// End-to-end test of the admin system against a local fake GitHub, with made-up data. Never touches real GitHub.
// Build first: npm run build && npm run test:admin
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { spawn } = require("child_process");
const { createFakeGitHub } = require("./fake-github.cjs");

const TOKEN = `test-token-${crypto.randomBytes(8).toString("hex")}`;
const KEY = crypto.randomBytes(32);
const SECRET = crypto.randomBytes(48).toString("base64url");
const PASSWORD = "Correct-Horse-Battery-9";
const API_PORT = 3990;
const REPO = "acme/private-store";
const DATA = "data/employees.json.enc";

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `scrypt.131072.8.1.${salt.toString("base64url")}.${crypto.scryptSync(pw, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }).toString("base64url")}`;
}
const STORED = hashPassword(PASSWORD);

const baseEnv = {
  ADMIN_USERS: `owner:${STORED}`,
  ADMIN_SESSION_SECRET: SECRET,
  DATA_ENCRYPTION_KEY: KEY.toString("base64"),
  GITHUB_STORAGE_REPO: REPO,
  GITHUB_STORAGE_TOKEN: TOKEN,
  GITHUB_API_URL: `http://127.0.0.1:${API_PORT}`,
  COOKIE_SECURE: "false",
};

const children = [];
async function startApp(port, env) {
  const clean = { ...process.env };
  for (const k of Object.keys(baseEnv)) delete clean[k];
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { env: { ...clean, ...env }, stdio: "ignore" });
  children.push(child);
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(`http://localhost:${port}/robots.txt`);
      return `http://localhost:${port}`;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`App on port ${port} did not start`);
}

let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${name}${!ok && detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ""}`);
}
const section = (name) => console.log(`\n${name}`);

function client(base, cookie) {
  const headers = () => ({ Origin: base, ...(cookie.value ? { Cookie: cookie.value } : {}) });
  return {
    base,
    get: (url, extra = {}) => fetch(base + url, { redirect: "manual", headers: { ...headers(), ...extra } }),
    post: (url, body, method = "POST", extra = {}) =>
      fetch(base + url, {
        method,
        redirect: "manual",
        headers: { ...headers(), ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...extra },
        body: body instanceof FormData ? body : JSON.stringify(body),
      }),
  };
}

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Mogadishu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const shift = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

function employeeForm(over = {}, photo) {
  const form = new FormData();
  const values = {
    fullName: "Test Person",
    companyName: "Example Security Ltd",
    employeeId: `E-${crypto.randomBytes(4).toString("hex")}`,
    phoneNumber: "+252 61 555 0100",
    bloodGroup: "AB-",
    dateOfBirth: "1984-07-19",
    jobPosition: "Guard",
    trainingDate: shift(today(), -2),
    mentalAssessment: "PRIVATE-ASSESSMENT-TEXT",
    assessmentResult: "Passed",
    assessmentRemarks: "PRIVATE-REMARK-TEXT",
    ...over,
  };
  for (const [k, v] of Object.entries(values)) form.set(k, v);
  if (photo) form.set("employeePhoto", new Blob([photo.data], { type: photo.type }), photo.name);
  return form;
}

function open(file, kind) {
  const at = 6;
  const d = crypto.createDecipheriv("aes-256-gcm", KEY, file.subarray(at, at + 12)).setAAD(Buffer.from(kind));
  d.setAuthTag(file.subarray(at + 12, at + 28));
  return Buffer.concat([d.update(file.subarray(at + 28)), d.final()]);
}
function sealDoc(doc) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", KEY, iv).setAAD(Buffer.from("employees"));
  const body = Buffer.concat([c.update(zlib.gzipSync(JSON.stringify(doc))), c.final()]);
  return Buffer.concat([Buffer.from("OGAAL1"), iv, c.getAuthTag(), body]);
}

function pdfText(pdf) {
  const raw = Buffer.from(pdf);
  let out = "";
  let at = 0;
  for (;;) {
    const s = raw.indexOf("stream", at);
    if (s < 0) break;
    const start = s + (raw[s + 6] === 13 ? 8 : 7);
    const end = raw.indexOf("endstream", start);
    if (end < 0) break;
    try {
      const text = zlib.inflateSync(raw.subarray(start, end)).toString("latin1");
      for (const m of text.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) out += `${Buffer.from(m[1], "hex").toString("latin1")}\n`;
    } catch {
      // not a compressed text stream
    }
    at = end + 9;
  }
  return out;
}

(async () => {
  const github = createFakeGitHub({ token: TOKEN });
  await new Promise((r) => github.server.listen(API_PORT, "127.0.0.1", r));
  const repo = github.repos.get(REPO);
  const readDoc = () => JSON.parse(zlib.gunzipSync(open(repo.files.get(DATA).data, "employees")).toString());
  const writeDoc = (doc) => {
    const data = sealDoc(doc);
    repo.files.set(DATA, { sha: github.shaOf(data), data });
  };

  const sharp = require("sharp");
  const jpeg = await sharp({ create: { width: 900, height: 1200, channels: 3, background: "#6688aa" } }).withMetadata({ exif: { IFD0: { Copyright: "SECRET-EXIF-MARKER" } } }).jpeg().toBuffer();
  const png = await sharp({ create: { width: 300, height: 120, channels: 4, background: { r: 10, g: 20, b: 60, alpha: 1 } } }).png().toBuffer();

  const [A, B] = await Promise.all([startApp(3991, baseEnv), startApp(3992, baseEnv)]);
  const session = { value: "" };
  const a = client(A, session);
  const b = client(B, session);
  const anon = client(A, { value: "" });

  section("Public site and access control");
  for (const p of ["/", "/about", "/training", "/partners", "/certification", "/faq", "/contact"]) check(`public page ${p}`, (await anon.get(p)).status === 200);
  check("removed /verify is gone", (await anon.get("/verify")).status === 404);
  check("public home has no admin data or links", !(await (await anon.get("/")).text()).includes("/admin"));
  for (const p of ["/admin", "/admin/dashboard", "/admin/employees", "/admin/employees/new", "/admin/employees/abc", "/admin/employees/abc/edit", "/admin/settings", "/admin/activity"]) {
    let res = await anon.get(p);
    if (res.status === 307 && res.headers.get("location") === "/admin/dashboard") res = await anon.get("/admin/dashboard");
    check(`signed-out ${p} goes to login`, res.status === 307 && res.headers.get("location") === "/admin/login", res.status);
  }
  check("login page renders", (await (await anon.get("/admin/login")).text()).includes("Admin login"));
  for (const [m, p] of [["GET", "/api/admin/employees/x/photo"], ["GET", "/api/admin/employees/x/certificate/pdf"], ["GET", "/api/admin/settings/asset/seal"], ["POST", "/api/admin/employees"], ["PATCH", "/api/admin/employees/x"], ["DELETE", "/api/admin/employees/x"], ["POST", "/api/admin/employees/x/certificate"], ["POST", "/api/admin/settings"], ["POST", "/api/admin/auth/logout"]]) {
    const res = m === "GET" ? await anon.get(p) : await anon.post(p, m === "DELETE" ? {} : new FormData(), m);
    check(`signed-out ${m} ${p} is 401`, res.status === 401, res.status);
  }

  section("Login");
  const login = (username, password, c = anon) => c.post("/api/admin/auth/login", { username, password });
  check("wrong password rejected", (await login("owner", "wrong-password-123")).status === 401);
  check("unknown user rejected", (await login("nobody", PASSWORD)).status === 401);
  const evil = await fetch(`${A}/api/admin/auth/login`, { method: "POST", headers: { Origin: "https://evil.example", "Content-Type": "application/json" }, body: JSON.stringify({ username: "owner", password: PASSWORD }) });
  check("login from another site blocked", evil.status === 403);
  const ok = await login("owner", PASSWORD);
  const setCookie = ok.headers.get("set-cookie") ?? "";
  check("correct password accepted", ok.status === 200);
  check("cookie is HttpOnly and SameSite", /HttpOnly/i.test(setCookie) && /SameSite=lax/i.test(setCookie));
  session.value = setCookie.split(";")[0];
  check("token not exposed in the login response", !(await ok.clone().text()).includes(TOKEN));
  check("dashboard opens", (await (await a.get("/admin/dashboard")).text()).includes("Total Registered Employees"));

  const sign = (payload) => `${payload}.${crypto.createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const fp = crypto.createHash("sha256").update(STORED).digest("base64url").slice(0, 16);
  const withToken = (t) => client(A, { value: `ogaal_admin=${t}` }).get("/admin/dashboard");
  check("tampered session rejected", (await withToken(`${session.value.split("=")[1].slice(0, -3)}abc`)).status === 307);
  check("expired session rejected", (await withToken(sign(b64({ u: "owner", f: fp, exp: 1000 })))).status === 307);
  check("session from an old password rejected", (await withToken(sign(b64({ u: "owner", f: "stale", exp: 4e9 })))).status === 307);
  check("session for a removed account rejected", (await withToken(sign(b64({ u: "ghost", f: fp, exp: 4e9 })))).status === 307);
  check("forged signature rejected", (await withToken(`${b64({ u: "owner", f: fp, exp: 4e9 })}.AAAA`)).status === 307);

  section("Validation");
  const fieldsOf = async (res) => ((await res.json()).fields ?? {});
  check("empty form lists the required fields", Object.keys(await fieldsOf(await a.post("/api/admin/employees", new FormData()))).length >= 7);
  const bad = async (over, field) => check(`rejects bad ${field}`, Boolean((await fieldsOf(await a.post("/api/admin/employees", employeeForm(over))))[field]));
  await bad({ phoneNumber: "abc" }, "phoneNumber");
  await bad({ bloodGroup: "Z+" }, "bloodGroup");
  await bad({ dateOfBirth: "2999-01-01" }, "dateOfBirth");
  await bad({ dateOfBirth: "2021-02-30" }, "dateOfBirth");
  await bad({ trainingDate: shift(today(), 3) }, "trainingDate");
  await bad({ assessmentResult: "Maybe" }, "assessmentResult");
  await bad({ fullName: "محمد" }, "fullName");
  check("not an image is rejected", Boolean((await fieldsOf(await a.post("/api/admin/employees", employeeForm({}, { data: Buffer.from("<script>alert(1)</script>"), type: "image/jpeg", name: "x.jpg" })))).employeePhoto));
  check("oversized image is rejected", Boolean((await fieldsOf(await a.post("/api/admin/employees", employeeForm({}, { data: Buffer.alloc(4 * 1024 * 1024 + 10), type: "image/jpeg", name: "x.jpg" })))).employeePhoto));
  check("rejected forms stored nothing", !repo.files.has(DATA) && ![...repo.files.keys()].some((f) => f.startsWith("employee-photos/")));
  const csrf = await fetch(`${A}/api/admin/employees`, { method: "POST", headers: { Cookie: session.value, Origin: "https://evil.example" }, body: employeeForm() });
  check("write from another site blocked, even with a session", csrf.status === 403);
  const noOrigin = await fetch(`${A}/api/admin/employees`, { method: "POST", headers: { Cookie: session.value }, body: employeeForm() });
  check("write with no Origin blocked", noOrigin.status === 403);

  section("Register, search, view");
  const PRIVATE = { fullName: "Amina Warsame Private", companyName: "Horn Protection Co", employeeId: "HP-1001", phoneNumber: "+252 61 777 4321", dateOfBirth: "1990-03-14", jobPosition: "Team Leader" };
  const created = await a.post("/api/admin/employees", employeeForm(PRIVATE, { data: jpeg, type: "image/jpeg", name: "me.jpg" }));
  const { id } = await created.json();
  check("employee registered", created.status === 200 && Boolean(id));
  const dupe = await a.post("/api/admin/employees", employeeForm({ ...PRIVATE, companyName: "horn protection co", employeeId: "hp-1001" }));
  check("same ID in the same company rejected", dupe.status === 422);
  check("same ID in another company allowed", (await a.post("/api/admin/employees", employeeForm({ fullName: "Other Firm Person", companyName: "Other Firm", employeeId: "HP-1001", assessmentResult: "Pending" }))).status === 200);

  const doc = readDoc();
  const rec = doc.employees.find((e) => e.id === id);
  const required = ["fullName", "companyName", "employeeId", "phoneNumber", "bloodGroup", "employeePhoto", "dateOfBirth", "jobPosition", "trainingDate", "certificateNumber", "certificateIssueDate", "certificateExpiryDate", "certificateValidity", "mentalAssessment", "assessmentResult", "assessmentRemarks", "authorizedSignature"];
  check("one record per employee, in one collection, with every field", Array.isArray(doc.employees) && required.every((f) => f in rec), required.filter((f) => !(f in rec)));

  for (const [label, q] of [["name", "amina warsame"], ["Employee ID", "hp-1001"], ["company", "Horn Protection"], ["phone", "777 4321"]]) {
    const html = await (await a.get(`/admin/employees?q=${encodeURIComponent(q)}`)).text();
    check(`search by ${label}`, html.includes("Amina Warsame Private"));
  }
  check("search with no match", (await (await a.get("/admin/employees?q=zzzzqq")).text()).includes("No employees match"));
  const view = await (await a.get(`/admin/employees/${id}`)).text();
  check("profile shows private fields to the admin", view.includes("PRIVATE-REMARK-TEXT") && view.includes("+252 61 777 4321"));
  check("unknown employee is 404", (await a.get("/admin/employees/does-not-exist")).status === 404);

  section("Encryption at rest");
  const everything = Buffer.concat([...repo.files.values()].map((f) => f.data));
  for (const secret of ["Amina", "HP-1001", "777 4321", "PRIVATE-REMARK", "Horn Protection", "1990-03-14", "owner"]) check(`repository does not contain "${secret}"`, !everything.includes(secret));
  const photoPath = rec.employeePhoto;
  const storedPhoto = repo.files.get(photoPath).data;
  check("stored photo is not a readable JPEG", storedPhoto.indexOf(Buffer.from([0xff, 0xd8, 0xff])) !== 0 && storedPhoto.subarray(0, 6).toString() === "OGAAL1");
  check("photo file name reveals nothing", /^employee-photos\/[0-9a-f-]{36}\.jpg\.enc$/.test(photoPath));
  const photo = await a.get(`/api/admin/employees/${id}/photo`);
  const photoBytes = Buffer.from(await photo.arrayBuffer());
  const meta = await sharp(photoBytes).metadata();
  check("photo comes back decrypted for the admin", photo.status === 200 && meta.format === "jpeg");
  check("photo resized and metadata removed", meta.height <= 640 && !meta.exif && !photoBytes.includes("SECRET-EXIF-MARKER"));
  check("repeat photo request is a 304 with no GitHub read", (await a.get(`/api/admin/employees/${id}/photo`, { "If-None-Match": photo.headers.get("etag") })).status === 304);
  check("photo is not publicly cached", /private/.test(photo.headers.get("cache-control") ?? ""));
  const commitText = JSON.stringify(repo.commits);
  check("commit messages and paths contain no personal data", !/Amina|HP-1001|Horn|777/.test(commitText));

  section("Certificates");
  const issue = (c, who) => c.post(`/api/admin/employees/${who}/certificate`, {});
  const pendingId = readDoc().employees.find((e) => e.fullName === "Other Firm Person").id;
  check("Pending assessment cannot get a certificate", (await issue(a, pendingId)).status === 409);
  check("no PDF before a certificate exists", (await a.get(`/api/admin/employees/${id}/certificate/pdf`)).status === 404);

  const settingsForm = new FormData();
  settingsForm.set("signatoryName", "Test Signatory");
  settingsForm.set("signatoryTitle", "Test Director");
  settingsForm.set("trainingTitle", "Firearms Safety Training");
  settingsForm.set("signature", new Blob([png], { type: "image/png" }), "s.png");
  settingsForm.set("seal", new Blob([png], { type: "image/png" }), "seal.png");
  check("settings save signature and seal", (await a.post("/api/admin/settings", settingsForm)).status === 200);
  check("signature readable by admin", (await a.get("/api/admin/settings/asset/signature")).status === 200);
  check("unknown asset kind is 404", (await a.get("/api/admin/settings/asset/other")).status === 404);

  const issued = await issue(a, id);
  const { certificateNumber } = await issued.json();
  check(`number format (${certificateNumber})`, new RegExp(`^OGAAL-${today().slice(0, 4)}-\\d{5}$`).test(certificateNumber));
  const cert = readDoc().employees.find((e) => e.id === id);
  const y = Number(today().slice(0, 4)) + 1;
  check("issue date is today, expiry one year later", cert.certificateIssueDate === today() && cert.certificateExpiryDate === `${y}${today().slice(4)}`, cert);
  check("validity is 1 Year", cert.certificateValidity === "1 Year");
  check("signature captured on issue", cert.authorizedSignature?.name === "Test Signatory");
  check("second certificate while valid is refused", (await issue(a, id)).status === 409);
  check("search by certificate number", (await (await a.get(`/admin/employees?q=${certificateNumber}`)).text()).includes("Amina Warsame Private"));

  const pdfRes = await a.get(`/api/admin/employees/${id}/certificate/pdf`);
  const pdf = Buffer.from(await pdfRes.arrayBuffer());
  fs.writeFileSync(path.join(process.env.TEST_OUTPUT_DIR || require("os").tmpdir(), "ogaal-test-certificate.pdf"), pdf);
  check("PDF downloads as an attachment", pdfRes.status === 200 && /attachment/.test(pdfRes.headers.get("content-disposition") ?? ""));
  check("PDF is not cached", /no-store/.test(pdfRes.headers.get("cache-control") ?? ""));
  const printRes = await a.get(`/api/admin/employees/${id}/certificate/pdf?inline=1`);
  check("print link opens inline", /inline/.test(printRes.headers.get("content-disposition") ?? ""));
  const { PDFDocument } = require("pdf-lib");
  const loaded = await PDFDocument.load(pdf);
  const { width, height } = loaded.getPage(0).getSize();
  check("one A4 landscape page", loaded.getPageCount() === 1 && Math.round(width) === 842 && Math.round(height) === 595);
  const text = pdfText(pdf);
  for (const want of ["Amina Warsame Private", "of Horn Protection Co", "HP-1001", certificateNumber, "Firearms Safety Training", "Test Signatory"]) check(`PDF shows ${want}`, text.includes(want), text);
  for (const never of ["777 4321", "AB-", "14 March 1990", "1990", "PRIVATE-", "Passed", "Team Leader"]) check(`PDF does not show ${never}`, !text.includes(never));
  const combined = pdf.toString("latin1");
  check("PDF metadata has no private data", !/Amina|HP-1001/.test(combined.slice(0, 300)));

  section("Status is calculated from the date");
  const setExpiry = (empId, expiry) => {
    const d = readDoc();
    Object.assign(d.employees.find((e) => e.id === empId), { certificateIssueDate: shift(expiry, -365), certificateExpiryDate: expiry });
    writeDoc(d);
  };
  const statusIs = async (label) => (await (await a.get(`/admin/employees/${id}`)).text()).includes(`>${label}</span>`);
  setExpiry(id, shift(today(), -1));
  check("expired yesterday reads Expired", await statusIs("Expired"));
  check("Expired filter finds it", (await (await a.get("/admin/employees?status=Expired")).text()).includes("Amina Warsame Private"));
  setExpiry(id, today());
  check("expires today reads Expiring Soon", await statusIs("Expiring Soon"));
  setExpiry(id, shift(today(), 30));
  check("30 days away reads Expiring Soon", await statusIs("Expiring Soon"));
  check("Expiring Soon filter finds it", (await (await a.get("/admin/employees?status=ExpiringSoon")).text()).includes("Amina Warsame Private"));
  setExpiry(id, shift(today(), 31));
  check("31 days away reads Active", await statusIs("Active"));
  check("Active filter finds it", (await (await a.get("/admin/employees?status=Active")).text()).includes("Amina Warsame Private"));
  setExpiry(id, shift(today(), -1));
  const renewed = await issue(a, id);
  const renewedNumber = (await renewed.json()).certificateNumber;
  check("expired certificate can be issued again with a new number", renewed.status === 200 && renewedNumber !== certificateNumber);

  section("Edit and overwrite protection");
  const current = readDoc().employees.find((e) => e.id === id);
  const editForm = (over) => {
    const f = employeeForm({ ...PRIVATE, ...over });
    f.set("revision", String(current.revision));
    return f;
  };
  check("edit saves", (await a.post(`/api/admin/employees/${id}`, editForm({ jobPosition: "Senior Leader" }), "PATCH")).status === 200);
  const stale = await a.post(`/api/admin/employees/${id}`, editForm({ jobPosition: "Stale Overwrite" }), "PATCH");
  check("second admin editing an old copy is stopped", stale.status === 409);
  check("stale edit changed nothing", readDoc().employees.find((e) => e.id === id).jobPosition === "Senior Leader");
  check("edit keeps the certificate number", readDoc().employees.find((e) => e.id === id).certificateNumber === renewedNumber);
  check("other server sees the edit straight away", (await (await b.get(`/admin/employees/${id}`)).text()).includes("Senior Leader"));
  const oldPhoto = readDoc().employees.find((e) => e.id === id).employeePhoto;
  const replace = employeeForm({ ...PRIVATE, jobPosition: "Senior Leader" }, { data: jpeg, type: "image/jpeg", name: "new.jpg" });
  replace.set("revision", String(readDoc().employees.find((e) => e.id === id).revision));
  check("photo can be replaced", (await a.post(`/api/admin/employees/${id}`, replace, "PATCH")).status === 200);
  check("old photo removed from storage", !repo.files.has(oldPhoto) && repo.files.has(readDoc().employees.find((e) => e.id === id).employeePhoto));
  const failed2 = readDoc().employees.find((e) => e.id === pendingId);
  const failedForm = employeeForm({ fullName: failed2.fullName, companyName: failed2.companyName, employeeId: failed2.employeeId, assessmentResult: "Failed" });
  failedForm.set("revision", String(failed2.revision));
  check("Failed result saves", (await a.post(`/api/admin/employees/${pendingId}`, failedForm, "PATCH")).status === 200);
  check("Failed assessment cannot get a certificate", (await issue(a, pendingId)).status === 409);
  const downgrade = employeeForm({ ...PRIVATE, jobPosition: "Senior Leader", assessmentResult: "Failed" });
  downgrade.set("revision", String(readDoc().employees.find((e) => e.id === id).revision));
  await a.post(`/api/admin/employees/${id}`, downgrade, "PATCH");
  check("certificate cannot print after the result is changed to Failed", (await a.get(`/api/admin/employees/${id}/certificate/pdf`)).status === 409);

  section("Two servers writing at the same time");
  const beforeConflicts = github.stats.conflicts;
  const results = await Promise.all(Array.from({ length: 24 }, (_, i) => (i % 2 ? a : b).post("/api/admin/employees", employeeForm({ fullName: `Parallel ${i}`, employeeId: `PAR-${i}` }))));
  const parallelIds = await Promise.all(results.map((r) => r.json()));
  const statuses = results.map((r) => r.status);
  check("all 24 parallel registrations saved", statuses.every((s) => s === 200), statuses);
  check("none lost", readDoc().employees.filter((e) => e.fullName.startsWith("Parallel ")).length === 24);
  check("GitHub really did reject conflicting writes, and they were retried", github.stats.conflicts > beforeConflicts, github.stats);
  const issues = await Promise.all(parallelIds.map((r, i) => issue(i % 2 ? a : b, r.id)));
  const numbers = await Promise.all(issues.map((r) => r.json()));
  check("all 24 parallel certificates issued", issues.every((r) => r.status === 200), issues.map((r) => r.status));
  const list = numbers.map((n) => n.certificateNumber);
  check("no duplicate certificate numbers", new Set(list).size === 24, list);
  const parts = list.map((n) => Number(n.slice(-5))).sort((x, y) => x - y);
  check("numbers are consecutive", parts.every((n, i) => i === 0 || n === parts[i - 1] + 1), parts);
  check("pagination splits the list", (await (await a.get("/admin/employees?page=2")).text()).replaceAll("<!-- -->", "").includes("Page 2 of 2"));
  check("conditional reads avoid rate limits", github.stats.notModified > 0, github.stats);

  section("Delete, numbers never reused, audit");
  const del = parallelIds[0].id;
  const delNumber = readDoc().employees.find((e) => e.id === del).certificateNumber;
  check("wrong confirmation refused", (await a.post(`/api/admin/employees/${del}`, { confirm: "nope" }, "DELETE")).status === 422);
  check("record still there", readDoc().employees.some((e) => e.id === del));
  check("correct confirmation deletes", (await a.post(`/api/admin/employees/${del}`, { confirm: "PAR-0" }, "DELETE")).status === 200);
  check("record gone", !readDoc().employees.some((e) => e.id === del));
  const delPhotoCase = await a.post("/api/admin/employees", employeeForm({ fullName: "Photo Delete", employeeId: "PD-1" }, { data: jpeg, type: "image/jpeg", name: "p.jpg" }));
  const pd = (await delPhotoCase.json()).id;
  const pdPhoto = readDoc().employees.find((e) => e.id === pd).employeePhoto;
  await a.post(`/api/admin/employees/${pd}`, { confirm: "PD-1" }, "DELETE");
  check("delete removes the stored photo", !repo.files.has(pdPhoto));
  const after = await a.post("/api/admin/employees", employeeForm({ fullName: "After Delete", employeeId: "AD-1" }));
  const afterNumber = (await (await issue(a, (await after.json()).id)).json()).certificateNumber;
  check("deleted number not reused", afterNumber !== delNumber && Number(afterNumber.slice(-5)) > parts[parts.length - 1], { afterNumber, delNumber });
  const activity = await (await a.get("/admin/activity")).text();
  for (const label of ["Logged in", "Registered employee", "Edited employee", "Deleted employee", "Issued certificate", "Changed settings", "Downloaded certificate PDF", "Opened certificate to print"]) check(`audit log records: ${label}`, activity.includes(label));
  const auditRaw = repo.files.get("data/audit-log.json.enc").data;
  check("audit log is encrypted", !auditRaw.includes("Amina") && auditRaw.subarray(0, 6).toString() === "OGAAL1");
  const dash = await (await a.get("/admin/dashboard")).text();
  check("dashboard shows the last backup date", /Last automatic backup:(?!.*none yet)/.test(dash.replace(/<[^>]+>/g, "")));

  section("Backups");
  const backupName = `backups/employees-${today()}.json.enc`;
  const backups = [...repo.files.keys()].filter((f) => f.startsWith("backups/"));
  check("one backup for today, not one per change", backups.length === 1 && backups[0] === backupName, backups);
  const backupDoc = JSON.parse(zlib.gunzipSync(open(repo.files.get(backupName).data, "employees")).toString());
  check("backup is encrypted and holds real records", backupDoc.employees.length >= 1 && !repo.files.get(backupName).data.includes("Amina"));
  const live = repo.files.get(DATA);
  const liveCount = readDoc().employees.length;
  repo.files.set(DATA, { sha: repo.files.get(backupName).sha, data: repo.files.get(backupName).data });
  const restored = (await (await a.get("/admin/employees")).text()).replaceAll("<!-- -->", "");
  check("restoring a backup file brings the older data back", restored.includes(`of ${backupDoc.employees.length}`) && backupDoc.employees.length < liveCount, { backup: backupDoc.employees.length, liveCount });
  repo.files.set(DATA, live);

  section("Large collection");
  const big = readDoc();
  const template = big.employees[0];
  const started = big.employees.length;
  for (let i = 0; i < 20000; i++) big.employees.push({ ...template, id: crypto.randomUUID(), fullName: `Seed Person ${crypto.randomBytes(6).toString("hex")}`, employeeId: `S-${i}`, phoneNumber: `+252 61 ${crypto.randomInt(1000000, 9999999)}`, employeePhoto: null, assessmentRemarks: crypto.randomBytes(40).toString("hex"), createdAt: new Date(Date.now() - i * 1000).toISOString() });
  writeDoc(big);
  const bigSize = repo.files.get(DATA).data.length;
  const bigStart = Date.now();
  const bigRes = await a.get("/admin/employees?q=S-19999");
  const bigHtml = await bigRes.text();
  const firstRead = Date.now() - bigStart;
  check(`file over 1 MB loads through the blob API (${(bigSize / 1048576).toFixed(2)} MB)`, bigSize > 1048576 && github.stats.blobReads > 0 && bigHtml.includes("S-19999"), { bigSize, stats: github.stats });
  const secondStart = Date.now();
  await (await a.get("/admin/employees?q=S-3000")).text();
  console.log(`      ${started + 20000} records: ${(bigSize / 1024).toFixed(0)} KB encrypted, first read ${firstRead} ms, cached search ${Date.now() - secondStart} ms`);
  const writeBig = await a.post("/api/admin/employees", employeeForm({ fullName: "Into Big File", employeeId: "BIG-1" }));
  check("can still write to the large file", writeBig.status === 200);
  repo.files.set(DATA, live);

  section("Safety refusals");
  const Pub = await startApp(3993, { ...baseEnv, GITHUB_STORAGE_REPO: "acme/public-store" });
  const pub = client(Pub, session);
  const pubRepo = github.repos.get("acme/public-store");
  check("a public repository is refused", (await pub.post("/api/admin/employees", employeeForm())).status === 503);
  check("nothing written to the public repository", pubRepo.files.size === 0);
  const Wrong = await startApp(3994, { ...baseEnv, DATA_ENCRYPTION_KEY: crypto.randomBytes(32).toString("base64") });
  const wrong = client(Wrong, session);
  const beforeSha = repo.files.get(DATA).sha;
  check("wrong encryption key cannot read records", (await wrong.get("/admin/employees")).status >= 500 || !(await (await wrong.get("/admin/employees")).text()).includes("Amina"));
  check("wrong key write fails", (await wrong.post("/api/admin/employees", employeeForm())).status >= 500);
  check("wrong key did not overwrite data", repo.files.get(DATA).sha === beforeSha);
  const BadToken = await startApp(3995, { ...baseEnv, GITHUB_STORAGE_TOKEN: "revoked-token" });
  const badToken = await client(BadToken, session).post("/api/admin/employees", employeeForm());
  const badBody = await badToken.text();
  check("revoked token gives a clean error, no details leaked", badToken.status === 503 && !badBody.includes("revoked-token") && !badBody.includes("GitHub"), badBody);
  const emptyEnv = Object.fromEntries(Object.keys(baseEnv).map((k) => [k, ""]));
  const None = await startApp(3996, emptyEnv);
  const none = client(None, { value: "" });
  check("without settings the public site still works", (await none.get("/")).status === 200);
  check("without settings the login page says so", (await (await none.get("/admin/login")).text()).includes("not configured"));
  check("without settings the API refuses", (await none.post("/api/admin/auth/login", { username: "owner", password: PASSWORD })).status === 503);
  check("without settings the dashboard redirects to login", (await none.get("/admin/dashboard")).status === 307);

  section("Secrets in browser code");
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  const chunks = walk(".next/static").filter((f) => f.endsWith(".js")).map((f) => fs.readFileSync(f, "latin1")).join("");
  for (const name of ["GITHUB_STORAGE_TOKEN", "DATA_ENCRYPTION_KEY", "ADMIN_SESSION_SECRET", "ADMIN_USERS", "api.github.com", "aes-256-gcm"]) check(`browser code does not contain ${name}`, !chunks.includes(name));
  const pageHtml = await (await a.get("/admin/dashboard")).text();
  check("admin page HTML does not contain the token or key", !pageHtml.includes(TOKEN) && !pageHtml.includes(KEY.toString("base64")));

  section("Logout and rate limit");
  const out = await a.post("/api/admin/auth/logout", {});
  check("logout clears the cookie", out.status === 200 && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(out.headers.get("set-cookie") ?? ""));
  let limited = false;
  for (let i = 0; i < 12 && !limited; i++) limited = (await login("owner-brute", "wrong-password-123")).status === 429;
  check("repeated wrong passwords are rate limited", limited);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
})()
  .catch((err) => {
    console.error("Test run stopped:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const c of children) c.kill();
    setTimeout(() => process.exit(), 300);
  });

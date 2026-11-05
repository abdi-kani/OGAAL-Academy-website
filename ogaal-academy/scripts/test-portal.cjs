// End-to-end test of the portal, run over HTTP against a running server and a disposable database.
// It creates and deletes data, so it refuses to run unless DB_NAME ends in _test.
// Needs: an empty migrated database, a Super Admin (TEST_ADMIN_LOGIN, TEST_ADMIN_PASSWORD), and BASE_URL.
// The server should send email through RESEND_API_URL=http://127.0.0.1:3199/ so reset emails can be captured.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const { connect } = require("./_env.cjs");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const ADMIN = { login: process.env.TEST_ADMIN_LOGIN, password: process.env.TEST_ADMIN_PASSWORD };
if (!/_test$/.test(process.env.DB_NAME || "")) {
  console.error("Refusing to run: DB_NAME must end in _test.");
  process.exit(1);
}

let passed = 0;
const failures = [];
function check(name, ok, extra = "") {
  if (ok) passed++;
  else failures.push(`${name}${extra ? ` -> ${extra}` : ""}`);
  console.log(`${ok ? "  ok  " : " FAIL "} ${name}${!ok && extra ? ` -> ${extra}` : ""}`);
}

let ipCounter = 10;
/** A client with its own cookie and its own address, so tests don't share rate-limit buckets. */
function client() {
  const ip = `10.1.0.${ipCounter++}`;
  let cookie = "";
  const send = async (method, url, body, headers = {}) => {
    const h = { Origin: BASE, Cookie: cookie, "X-Forwarded-For": ip, ...headers };
    let payload = body;
    if (body && !(body instanceof FormData)) {
      h["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(BASE + url, { method, headers: h, body: payload, redirect: "manual" });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) if (c.startsWith("ogaal_session=")) cookie = c.split(";")[0];
    return res;
  };
  return {
    get: (u, h) => send("GET", u, undefined, h),
    post: (u, b, h) => send("POST", u, b ?? {}, h),
    patch: (u, b) => send("PATCH", u, b),
    del: (u, b) => send("DELETE", u, b ?? {}),
    login: async (login, password) => send("POST", "/api/portal/auth/login", { login, password }),
    json: async (r) => r.json().catch(() => ({})),
  };
}

function employeeForm(overrides = {}) {
  const f = new FormData();
  const values = { full_name: "Test Person", company_name: "Alpha Security", employee_id: `E-${Math.random().toString(36).slice(2, 10)}`, phone_number: "+252 61 555 0100", blood_group: "O+", date_of_birth: "1990-04-12", job_position: "Security Officer", training_date: "2026-10-01", ...overrides };
  for (const [k, v] of Object.entries(values)) if (v !== null) f.set(k, v);
  return f;
}

function assessmentForm(result, approve) {
  const f = new FormData();
  f.set("assessment_result", result);
  f.set("assessment_date", "2026-10-02");
  f.set("assessor_name", "Assessor One");
  f.set("mental_assessment", "PRIVATE-SUMMARY-TEXT");
  f.set("assessment_remarks", "PRIVATE-REMARK-TEXT");
  if (approve) f.set("approve", "on");
  return f;
}

(async () => {
  const db = await connect();
  const sql = async (q, p = []) => (await db.query(q, p))[0];

  // Captures reset emails sent through the Resend-compatible endpoint.
  const emails = [];
  const mail = http.createServer((req, res) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => {
      emails.push(JSON.parse(d));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("{}");
    });
  });
  await new Promise((r) => mail.listen(3199, "127.0.0.1", r));

  console.log("\nPublic website");
  const anon = client();
  for (const p of ["/", "/about", "/training", "/partners", "/certification", "/faq", "/contact", "/verify"]) {
    const r = await anon.get(p);
    const html = await r.text();
    check(`${p} loads with site header and footer`, r.status === 200 && html.includes("<header") && html.includes("<footer"), `status ${r.status}`);
  }
  check("/faqs still redirects", (await anon.get("/faqs")).status === 308);
  check("unknown page is 404", (await anon.get("/no-such-page")).status === 404);

  console.log("\nAccess without signing in");
  for (const p of ["/portal", "/portal/employees", "/portal/users", "/portal/settings", "/portal/logs"]) {
    const r = await anon.get(p);
    const loc = r.headers.get("location") ?? "";
    const body = r.status === 200 ? await r.text() : "";
    check(`${p} sends visitor to sign-in`, loc.includes("/portal/login") || body.includes("/portal/login"), `status ${r.status}`);
  }
  for (const [m, p] of [["get", "/api/portal/employees/1/photo"], ["get", "/api/portal/employees/1/certificate/pdf"], ["get", "/api/portal/reports/export?format=xlsx"], ["post", "/api/portal/employees"]]) {
    check(`${m.toUpperCase()} ${p} is 401`, (await anon[m](p)).status === 401);
  }

  console.log("\nSign-in and sessions");
  const sa = client();
  check("wrong password rejected", (await sa.login(ADMIN.login, "wrong-password-x")).status === 401);
  check("request from another site blocked", (await sa.post("/api/portal/auth/login", { login: ADMIN.login, password: ADMIN.password }, { Origin: "https://evil.example" })).status === 403);
  const loginRes = await sa.login(ADMIN.login, ADMIN.password);
  check("Super Admin signs in", loginRes.status === 200);
  check("session cookie is httpOnly with SameSite", /HttpOnly/i.test(loginRes.headers.get("set-cookie")) && /SameSite=lax/i.test(loginRes.headers.get("set-cookie")));
  const storedHash = (await sql("SELECT password_hash FROM users WHERE username = ? OR email = ?", [ADMIN.login, ADMIN.login]))[0].password_hash;
  check("password stored as scrypt hash", storedHash.startsWith("scrypt$") && !storedHash.includes(ADMIN.password));
  const sess = (await sql("SELECT token_hash FROM user_sessions LIMIT 1"))[0];
  check("session token stored hashed", sess.token_hash.length === 64 && !(loginRes.headers.get("set-cookie") ?? "").includes(sess.token_hash));
  const limited = client();
  let last;
  for (let i = 0; i < 9; i++) last = await limited.login("nobody-here", "wrong-password-x");
  check("repeated failed sign-ins are rate limited", last.status === 429, `status ${last.status}`);
  const rotating = [];
  for (let i = 0; i < 9; i++) rotating.push((await client().login("rotator", "wrong-password-x")).status);
  check("rate limit holds when the address changes", rotating.at(-1) === 429, rotating.join());

  console.log("\nUser management");
  const mkUser = async (actor, username, role, company = "") => {
    const f = new FormData();
    f.set("full_name", `${role} ${username}`);
    f.set("username", username);
    f.set("email", `${username}@example.test`);
    f.set("role", role);
    f.set("account_status", "Active");
    if (company) f.set("assigned_company", company);
    return actor.post("/api/portal/users", f);
  };
  const activate = async (username, temp) => {
    const c = client();
    const r = await c.login(username, temp);
    if (r.status !== 200) throw new Error(`Could not sign in ${username}: ${r.status}`);
    const password = `Password-${username}-123`;
    const ch = await c.post("/api/portal/account/password", { current: temp, next: password });
    if (ch.status !== 200) throw new Error(`Could not change password for ${username}`);
    return c;
  };
  const adminRes = await mkUser(sa, "admin1", "Admin");
  const adminBody = await sa.json(adminRes);
  check("Super Admin creates an Admin", adminRes.status === 201 && adminBody.temporaryPassword?.length >= 12);
  const pending = client();
  await pending.login("admin1", adminBody.temporaryPassword);
  check("temporary password must be changed first", (await pending.post("/api/portal/employees", employeeForm())).status === 403);
  const admin = await activate("admin1", adminBody.temporaryPassword);
  const staffBody = await sa.json(await mkUser(sa, "staff1", "Staff"));
  const staff = await activate("staff1", staffBody.temporaryPassword);
  const verifierBody = await sa.json(await mkUser(sa, "verify1", "Verification User"));
  const verifier = await activate("verify1", verifierBody.temporaryPassword);
  check("duplicate username rejected", (await mkUser(sa, "staff1", "Staff")).status === 409);
  check("Admin cannot create a Super Admin", (await mkUser(admin, "bad1", "Super Admin")).status === 403);
  check("Admin cannot create an Admin", (await mkUser(admin, "bad2", "Admin")).status === 403);
  check("Admin can create Staff", (await mkUser(admin, "staff2", "Staff")).status === 201);
  check("Staff cannot create users", (await mkUser(staff, "bad3", "Staff")).status === 403);

  const saId = (await sql("SELECT id FROM users WHERE role = 'Super Admin' LIMIT 1"))[0].id;
  const adminId = (await sql("SELECT id FROM users WHERE username = 'admin1'"))[0].id;
  const userPatch = (username, role, status = "Active") => {
    const f = new FormData();
    f.set("full_name", "Changed Name");
    f.set("username", username);
    f.set("email", `${username}@example.test`);
    f.set("role", role);
    f.set("account_status", status);
    return f;
  };
  check("Admin cannot edit a Super Admin", (await admin.patch(`/api/portal/users/${saId}`, userPatch("x", "Staff"))).status === 403);
  check("Admin cannot reset a Super Admin password", (await admin.post(`/api/portal/users/${saId}`)).status === 403);
  check("Admin cannot raise their own role", (await admin.patch(`/api/portal/users/${adminId}`, userPatch("admin1", "Super Admin"))).status === 403);
  const saUsername = (await sql("SELECT username FROM users WHERE id = ?", [saId]))[0].username;
  check("Super Admin cannot demote themselves", (await sa.patch(`/api/portal/users/${saId}`, userPatch(saUsername, "Staff"))).status === 422);

  console.log("\nRole permissions");
  const checkPage = async (who, c, page, allowed) => {
    const r = await c.get(page);
    const redirected = r.status >= 300 && r.status < 400;
    const html = r.status === 200 ? await r.text() : "";
    const bounced = redirected || html.includes("NEXT_REDIRECT");
    check(`${who} ${allowed ? "can open" : "is kept out of"} ${page}`, allowed ? !bounced && r.status === 200 : bounced, `status ${r.status}`);
  };
  await checkPage("Staff", staff, "/portal/employees", true);
  for (const p of ["/portal/users", "/portal/reports", "/portal/logs", "/portal/settings", "/portal/certificates"]) await checkPage("Staff", staff, p, false);
  await checkPage("Verification User", verifier, "/portal/verification", true);
  for (const p of ["/portal", "/portal/employees", "/portal/employees/new", "/portal/users", "/portal/certificates"]) await checkPage("Verification User", verifier, p, false);
  await checkPage("Admin", admin, "/portal/logs", true);
  await checkPage("Admin", admin, "/portal/settings", false);
  await checkPage("Super Admin", sa, "/portal/settings", true);
  for (const p of ["/portal", "/portal/employees", "/portal/employees/new", "/portal/assessments", "/portal/certificates", "/portal/verification", "/portal/users", "/portal/users/new", "/portal/reports", "/portal/logs", "/portal/account"]) await checkPage("Super Admin", sa, p, true);
  check("Verification User cannot list employee photos", (await verifier.get("/api/portal/employees/1/photo")).status === 403);
  check("Verification User cannot register employees", (await verifier.post("/api/portal/employees", employeeForm())).status === 403);

  console.log("\nEmployee registration");
  const png = await sharp({ create: { width: 600, height: 800, channels: 3, background: "#3366aa" } }).png().toBuffer();
  const form1 = employeeForm({ full_name: "Amina Hassan Ali", employee_id: "EMP-1001", phone_number: "+252 61 777 1234", blood_group: "AB-", date_of_birth: "1987-06-15" });
  form1.set("employee_photo", new File([png], "photo.png", { type: "image/png" }));
  const created = await staff.post("/api/portal/employees", form1);
  const emp1 = await staff.json(created);
  check("Staff registers an employee with a photo", created.status === 201 && emp1.id > 0, JSON.stringify(emp1));
  check("no certificate before assessment", emp1.certificate_number === null);
  const row1 = (await sql("SELECT * FROM employee_certificates WHERE id = ?", [emp1.id]))[0];
  check("photo stored outside the public folder", row1.employee_photo && !row1.employee_photo.includes("public") && fs.existsSync(path.resolve(process.env.STORAGE_DIR, row1.employee_photo)));
  check("photo is not reachable as a public URL", (await anon.get(`/${row1.employee_photo}`)).status === 404);
  check("photo needs a session", (await anon.get(`/api/portal/employees/${emp1.id}/photo`)).status === 401);
  const photo = await staff.get(`/api/portal/employees/${emp1.id}/photo`);
  check("signed-in staff can see the photo", photo.status === 200 && photo.headers.get("content-type") === "image/jpeg");
  check("duplicate Employee ID rejected", (await staff.post("/api/portal/employees", employeeForm({ employee_id: "EMP-1001" }))).status === 409);
  check("duplicate differing only by case rejected", (await staff.post("/api/portal/employees", employeeForm({ employee_id: "emp-1001" }))).status === 409);
  const badUpload = employeeForm();
  badUpload.set("employee_photo", new File(["<script>alert(1)</script>"], "photo.png", { type: "image/png" }));
  check("fake image upload rejected", (await staff.post("/api/portal/employees", badUpload)).status === 422);
  const svg = employeeForm();
  svg.set("employee_photo", new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], "a.svg", { type: "image/svg+xml" }));
  check("SVG upload rejected", (await staff.post("/api/portal/employees", svg)).status === 422);
  check("missing required fields rejected", (await staff.post("/api/portal/employees", employeeForm({ full_name: "" }))).status === 422);
  check("future date of birth rejected", (await staff.post("/api/portal/employees", employeeForm({ date_of_birth: "2999-01-01" }))).status === 422);
  check("name that can't print is rejected", (await staff.post("/api/portal/employees", employeeForm({ full_name: "محمد" }))).status === 422);
  const staffAssess = employeeForm({ include_assessment: "1", assessment_result: "Passed", approve: "on" });
  const sneaky = await staff.json(await staff.post("/api/portal/employees", staffAssess));
  const sneakyRow = (await sql("SELECT assessment_result, assessment_approved_at, certificate_number FROM employee_certificates WHERE id = ?", [sneaky.id]))[0];
  check("Staff cannot slip an assessment into registration", sneakyRow.assessment_result === "Pending" && !sneakyRow.assessment_approved_at && !sneakyRow.certificate_number);

  console.log("\nAssessment and automatic certificate");
  const assessUrl = `/api/portal/employees/${emp1.id}/assessment`;
  check("Staff cannot record assessments", (await staff.post(assessUrl, assessmentForm("Passed", true))).status === 403);
  check("Pending cannot be approved", (await admin.post(assessUrl, assessmentForm("Pending", true))).status === 422);
  const failed = await admin.json(await admin.post(assessUrl, assessmentForm("Failed", true)));
  check("approved fail issues no certificate", !failed.certificate_number);
  const unapproved = await admin.json(await admin.post(assessUrl, assessmentForm("Passed", false)));
  check("unapproved pass issues no certificate", !unapproved.certificate_number);
  const r1 = (await sql("SELECT assessment_approved_at FROM employee_certificates WHERE id = ?", [emp1.id]))[0];
  check("changing the result clears the earlier approval", !r1.assessment_approved_at);
  check("manual issue refused without approval", (await admin.post(`/api/portal/employees/${emp1.id}/certificate`, { action: "issue" })).status === 409);
  const beforeSeq = await sql("SELECT setting_value FROM system_settings WHERE setting_key LIKE 'cert_seq_%'");
  check("no certificate number spent so far", beforeSeq.length === 0);
  const approved = await admin.json(await admin.post(assessUrl, assessmentForm("Passed", true)));
  const year = new Date().getFullYear();
  check("approved pass issues the first number", approved.certificate_number === `CERT-${year}-00001`, approved.certificate_number);
  const issued = (await sql("SELECT * FROM employee_certificates WHERE id = ?", [emp1.id]))[0];
  check("status is Active", issued.certificate_status === "Active");
  check("validity is one year", issued.certificate_validity === "1 Year");
  const expectedExpiry = `${Number(issued.certificate_issue_date.slice(0, 4)) + 1}${issued.certificate_issue_date.slice(4)}`;
  check("expiry is one year after issue", issued.certificate_expiry_date === expectedExpiry, issued.certificate_expiry_date);
  check("PDF was generated and stored", issued.certificate_pdf_path && fs.existsSync(path.resolve(process.env.STORAGE_DIR, issued.certificate_pdf_path)));
  check("verification token is random, not the number", /^[a-f0-9]{32}$/.test(issued.verification_token));
  check("result can't leave Passed while certificate is active", (await admin.post(assessUrl, assessmentForm("Failed", true))).status === 409);
  check("Staff cannot edit a record with a certificate", (await staff.patch(`/api/portal/employees/${emp1.id}`, employeeForm({ employee_id: "EMP-1001" }))).status === 403);
  const staffView = await (await staff.get(`/portal/employees/${emp1.id}`)).text();
  check("Staff cannot read private assessment notes", !staffView.includes("PRIVATE-REMARK-TEXT") && !staffView.includes("PRIVATE-SUMMARY-TEXT"));
  const adminView = await (await admin.get(`/portal/employees/${emp1.id}`)).text();
  check("Admin can read assessment notes", adminView.includes("PRIVATE-REMARK-TEXT"));
  check("page data carries no storage paths or tokens", !adminView.includes(issued.verification_token) && !adminView.includes(issued.certificate_pdf_path));

  console.log("\nCertificate PDF");
  const pdf = await admin.get(`/api/portal/employees/${emp1.id}/certificate/pdf`);
  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  check("Admin downloads a real PDF", pdf.status === 200 && pdfBytes.subarray(0, 5).toString() === "%PDF-");
  check("PDF is sent as an attachment with the number as its name", (pdf.headers.get("content-disposition") ?? "").includes(`CERT-${year}-00001.pdf`));
  check("Staff cannot download certificates", (await staff.get(`/api/portal/employees/${emp1.id}/certificate/pdf`)).status === 403);
  if (process.env.TEST_OUTPUT_DIR) fs.writeFileSync(path.join(process.env.TEST_OUTPUT_DIR, "certificate.pdf"), pdfBytes);
  const editForm = employeeForm({ full_name: "Amina Hassan Ali Warsame", employee_id: "EMP-1001", phone_number: "+252 61 777 1234", blood_group: "AB-", date_of_birth: "1987-06-15" });
  check("Admin edits a printed field", (await admin.patch(`/api/portal/employees/${emp1.id}`, editForm)).status === 200);
  const edited = (await sql("SELECT certificate_pdf_path, certificate_number FROM employee_certificates WHERE id = ?", [emp1.id]))[0];
  check("PDF regenerated after the edit", edited.certificate_pdf_path !== issued.certificate_pdf_path && !fs.existsSync(path.resolve(process.env.STORAGE_DIR, issued.certificate_pdf_path)));
  check("certificate number unchanged by the edit", edited.certificate_number === issued.certificate_number);
  fs.rmSync(path.resolve(process.env.STORAGE_DIR, edited.certificate_pdf_path));
  check("missing PDF is rebuilt on download", (await admin.get(`/api/portal/employees/${emp1.id}/certificate/pdf`)).status === 200);

  console.log("\nPublic verification");
  const verifyHtml = async (url) => (await client().get(url)).text();
  const valid = await verifyHtml(`/verify?number=CERT-${year}-00001`);
  check("valid certificate shows VALID", valid.includes(">VALID<") && valid.includes("Amina Hassan Ali Warsame"));
  check("lower-case number also works", (await verifyHtml(`/verify?number=cert-${year}-00001`)).includes(">VALID<"));
  for (const [label, needle] of [["phone number", "777 1234"], ["date of birth", "1987"], ["blood group", "AB-"], ["remarks", "PRIVATE-REMARK-TEXT"], ["assessment summary", "PRIVATE-SUMMARY-TEXT"], ["storage path", "certificates/"], ["photo path", "photos/"]]) {
    check(`verification does not expose ${label}`, !valid.includes(needle));
  }
  check("states it is not a licence", valid.includes("does not replace a firearm licence"));
  const current = (await sql("SELECT verification_token FROM employee_certificates WHERE id = ?", [emp1.id]))[0];
  check("QR link shows VALID", (await verifyHtml(`/verify/c/${current.verification_token}`)).includes(">VALID<"));
  check("unknown number shows NOT FOUND", (await verifyHtml("/verify?number=CERT-1999-99999")).includes(">NOT FOUND<"));
  check("malformed number shows NOT FOUND", (await verifyHtml(`/verify?number=${encodeURIComponent("' OR 1=1 --")}`)).includes(">NOT FOUND<"));
  check("forged token shows NOT FOUND", (await verifyHtml(`/verify/c/${"0".repeat(32)}`)).includes(">NOT FOUND<"));
  const internal = await (await verifier.get(`/portal/verification?number=CERT-${year}-00001`)).text();
  check("Verification User sees the result, without private data", internal.includes(">VALID<") && !internal.includes("777 1234"));
  const flood = client();
  let flooded = "";
  for (let i = 0; i < 31; i++) flooded = await (await flood.get("/verify?number=CERT-1999-00001")).text();
  check("public verification is rate limited", flooded.includes("Too many checks"));
  const spoofIp = `10.9.0.${ipCounter++}`;
  let spoofed = "";
  for (let i = 0; i < 31; i++) spoofed = await (await anon.get("/verify?number=CERT-1999-00001", { "X-Forwarded-For": `192.0.2.${i}, ${spoofIp}` })).text();
  check("forged forwarding addresses don't escape the limit", spoofed.includes("Too many checks"));

  console.log("\nUnique numbers under load");
  const ids = [];
  for (let i = 0; i < 25; i++) {
    const form = employeeForm({ full_name: `Parallel ${i}`, employee_id: `PAR-${i}` });
    ids.push((await admin.json(await admin.post("/api/portal/employees", form))).id);
  }
  await Promise.all(ids.map((id) => admin.post(`/api/portal/employees/${id}/assessment`, assessmentForm("Passed", true))));
  const numbers = (await sql("SELECT certificate_number FROM employee_certificates WHERE employee_id LIKE 'PAR-%'")).map((r) => r.certificate_number);
  check("25 simultaneous approvals all get a number", numbers.filter(Boolean).length === 25, String(numbers.filter(Boolean).length));
  check("all 25 numbers are different", new Set(numbers).size === 25);

  console.log("\nRenew and revoke");
  const certUrl = `/api/portal/employees/${emp1.id}/certificate`;
  check("Staff cannot renew", (await staff.post(certUrl, { action: "renew" })).status === 403);
  const oldToken = current.verification_token;
  const renewed = await admin.json(await admin.post(certUrl, { action: "renew" }));
  check("renewal gives a new number", /^CERT-\d{4}-\d{5}$/.test(renewed.certificate_number ?? "") && renewed.certificate_number !== `CERT-${year}-00001`, renewed.certificate_number);
  const afterRenew = (await sql("SELECT * FROM employee_certificates WHERE id = ?", [emp1.id]))[0];
  const history = typeof afterRenew.certificate_history === "string" ? JSON.parse(afterRenew.certificate_history) : afterRenew.certificate_history;
  check("previous certificate kept in this row's history", history.length === 1 && history[0].certificate_number === `CERT-${year}-00001`);
  check("no extra tables hold certificates", (await sql("SHOW TABLES")).every((t) => !/^(employees|trainings?|assessments?|certificates?)$/.test(Object.values(t)[0])));
  check("old number now shows EXPIRED, marked as replaced", (await verifyHtml(`/verify?number=CERT-${year}-00001`)).includes("Replaced by a newer certificate"));
  check("old QR code also shows it", (await verifyHtml(`/verify/c/${oldToken}`)).includes(">EXPIRED<"));
  check("new number shows VALID", (await verifyHtml(`/verify?number=${renewed.certificate_number}`)).includes(">VALID<"));
  check("earlier certificate can still be downloaded", (await admin.get(`${certUrl}/pdf?number=CERT-${year}-00001`)).status === 200);
  check("another employee's certificate can't be fetched through this record", (await admin.get(`${certUrl}/pdf?number=CERT-${year}-00002`)).status === 404);
  check("revoke needs a reason", (await admin.post(certUrl, { action: "revoke", reason: "" })).status === 422);
  check("Admin revokes", (await admin.post(certUrl, { action: "revoke", reason: "Test revocation" })).status === 200);
  check("revoked certificate shows REVOKED", (await verifyHtml(`/verify?number=${renewed.certificate_number}`)).includes(">REVOKED<"));
  check("revoking twice is refused", (await admin.post(certUrl, { action: "revoke", reason: "Again please" })).status === 409);
  check("Admin cannot renew a revoked certificate", (await admin.post(certUrl, { action: "renew" })).status === 403);
  check("Super Admin can renew a revoked certificate", (await sa.post(certUrl, { action: "renew" })).status === 200);

  console.log("\nExpiry");
  const expId = ids[0];
  const expRow = (await sql("SELECT certificate_number FROM employee_certificates WHERE id = ?", [expId]))[0];
  await sql("UPDATE employee_certificates SET certificate_issue_date = '2024-01-01', certificate_expiry_date = '2025-01-01' WHERE id = ?", [expId]);
  check("past expiry date shows EXPIRED at once", (await verifyHtml(`/verify?number=${expRow.certificate_number}`)).includes(">EXPIRED<"));
  const todayRow = ids[1];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: process.env.APP_TIMEZONE || "Africa/Mogadishu" }).format(new Date());
  const todayCert = (await sql("SELECT certificate_number FROM employee_certificates WHERE id = ?", [todayRow]))[0];
  await sql("UPDATE employee_certificates SET certificate_expiry_date = ? WHERE id = ?", [today, todayRow]);
  check("still VALID on the expiry date itself", (await verifyHtml(`/verify?number=${todayCert.certificate_number}`)).includes(">VALID<"));
  check("expired certificate can be renewed", (await admin.post(`/api/portal/employees/${expId}/certificate`, { action: "renew" })).status === 200);

  console.log("\nCompany scoping");
  const scopedStaffBody = await sa.json(await mkUser(sa, "scoped1", "Staff", "Beta Logistics"));
  const scoped = await activate("scoped1", scopedStaffBody.temporaryPassword);
  const scopedAdminBody = await sa.json(await mkUser(sa, "scopedadmin", "Admin", "Beta Logistics"));
  const scopedAdmin = await activate("scopedadmin", scopedAdminBody.temporaryPassword);
  const betaForm = employeeForm({ full_name: "Beta Worker", employee_id: "BETA-1", company_name: "Alpha Security" });
  const beta = await scoped.json(await scoped.post("/api/portal/employees", betaForm));
  const betaRow = (await sql("SELECT company_name FROM employee_certificates WHERE id = ?", [beta.id]))[0];
  check("scoped user's record is forced into their company", betaRow.company_name === "Beta Logistics", betaRow.company_name);
  const scopedList = await (await scoped.get("/portal/employees")).text();
  check("scoped user's list hides other companies", scopedList.includes("Beta Worker") && !scopedList.includes("Amina Hassan"));
  check("scoped user gets 404 on another company's photo", (await scoped.get(`/api/portal/employees/${emp1.id}/photo`)).status === 404);
  check("scoped user can't edit another company's record", (await scoped.patch(`/api/portal/employees/${emp1.id}`, employeeForm())).status === 404);
  check("scoped admin can't touch another company's certificate", (await scopedAdmin.post(certUrl, { action: "revoke", reason: "Not mine" })).status === 404);
  const xl = await scopedAdmin.get("/api/portal/reports/export?format=xlsx");
  const xlBytes = Buffer.from(await xl.arrayBuffer());
  const ExcelJS = require("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(xlBytes);
  const names = [];
  book.worksheets[0].eachRow((row) => names.push(String(row.getCell(1).value)));
  check("scoped admin's export holds only their company", names.includes("Beta Worker") && !names.some((n) => n.startsWith("Amina") || n.startsWith("Parallel")), names.join());
  const widen = new FormData();
  widen.set("full_name", "Wide");
  widen.set("username", "wide1");
  widen.set("email", "wide1@example.test");
  widen.set("role", "Staff");
  widen.set("assigned_company", "");
  const wide = await scopedAdmin.json(await scopedAdmin.post("/api/portal/users", widen));
  const wideRow = (await sql("SELECT assigned_company FROM users WHERE id = ?", [wide.id]))[0];
  check("scoped admin can't create an all-company user", wideRow.assigned_company === "Beta Logistics");
  const staff2Id = (await sql("SELECT id FROM users WHERE username = 'staff2'"))[0].id;
  check("scoped admin can't manage other companies' users", (await scopedAdmin.post(`/api/portal/users/${staff2Id}`)).status === 403);

  console.log("\nSearch, filters and exports");
  const search = await (await admin.get("/portal/employees?q=EMP-1001")).text();
  check("search finds by Employee ID", search.includes("Amina Hassan") && !search.includes("Parallel 3"));
  const injected = await admin.get(`/portal/employees?q=${encodeURIComponent("' OR '1'='1")}`);
  const injectedHtml = await injected.text();
  check("SQL injection attempt in search finds nothing", injected.status === 200 && injectedHtml.includes("No employees match"));
  check("bad sort column is ignored", (await admin.get(`/portal/employees?sort=${encodeURIComponent("id; DROP TABLE users")}`)).status === 200);
  check("users table intact", (await sql("SELECT COUNT(*) AS c FROM users"))[0].c > 0);
  check("status filter works", (await (await admin.get("/portal/employees?status=Revoked")).text()).includes("No employees match"));
  const xlsx = await admin.get("/api/portal/reports/export?format=xlsx");
  check("Excel export is a real workbook", xlsx.status === 200 && Buffer.from(await xlsx.arrayBuffer()).subarray(0, 2).toString() === "PK");
  const rep = await admin.get("/api/portal/reports/export?format=pdf");
  check("PDF report is a real PDF", rep.status === 200 && Buffer.from(await rep.arrayBuffer()).subarray(0, 5).toString() === "%PDF-");
  check("Staff cannot export", (await staff.get("/api/portal/reports/export?format=xlsx")).status === 403);
  await admin.post("/api/portal/employees", employeeForm({ full_name: "=HYPERLINK(1)", employee_id: "FORMULA-1" }));
  const fx = new ExcelJS.Workbook();
  await fx.xlsx.load(Buffer.from(await (await admin.get("/api/portal/reports/export?format=xlsx&q=FORMULA-1")).arrayBuffer()));
  const cell = fx.worksheets[0].getRow(2).getCell(1).value;
  check("spreadsheet formula in a name is neutralised", typeof cell === "string" && cell.startsWith("'="), String(cell));

  console.log("\nPassword reset");
  emails.length = 0;
  const forgot = client();
  const unknown = await forgot.post("/api/portal/auth/forgot", { login: "no-such-user" });
  const known = await forgot.post("/api/portal/auth/forgot", { login: "staff2" });
  check("same response whether or not the account exists", unknown.status === 200 && known.status === 200 && JSON.stringify(await unknown.json()) === JSON.stringify(await known.json()));
  check("only the real account gets an email", emails.length === 1 && emails[0].to[0] === "staff2@example.test", String(emails.length));
  const link = /https?:\S+token=(\S+)/.exec(emails[0]?.text ?? "");
  check("email link uses the configured site address, not the request's", link?.[0].startsWith(process.env.PORTAL_BASE_URL));
  const stored = await sql("SELECT token_hash FROM password_resets");
  check("reset token stored hashed", stored.every((s) => s.token_hash !== link?.[1]));
  check("forged token refused", (await forgot.post("/api/portal/auth/reset", { token: "forged", password: "New-password-12345" })).status === 400);
  check("short password refused", (await forgot.post("/api/portal/auth/reset", { token: link?.[1], password: "short" })).status === 422);
  check("valid token sets the password", (await forgot.post("/api/portal/auth/reset", { token: link?.[1], password: "New-password-12345" })).status === 200);
  check("token works only once", (await forgot.post("/api/portal/auth/reset", { token: link?.[1], password: "Another-password-123" })).status === 400);
  check("can sign in with the new password", (await client().login("staff2", "New-password-12345")).status === 200);

  console.log("\nAccount changes take effect at once");
  const live = client();
  await live.login("staff2", "New-password-12345");
  check("session works before the reset", (await live.get("/portal/employees")).status === 200);
  const reset = await admin.json(await admin.post(`/api/portal/users/${staff2Id}`));
  check("Admin reset returns a temporary password", reset.temporaryPassword?.length >= 12);
  const afterReset = await live.get("/portal/employees");
  check("administrator reset ends existing sessions", afterReset.status >= 300 || (await afterReset.text()).includes("/portal/login"));
  const deact = client();
  const verifyId = (await sql("SELECT id FROM users WHERE username = 'verify1'"))[0].id;
  check("Admin deactivates a user", (await admin.patch(`/api/portal/users/${verifyId}`, userPatch("verify1", "Verification User", "Inactive"))).status === 200);
  const afterDeact = await verifier.get("/portal/verification");
  check("deactivated user's session stops working", afterDeact.status >= 300 || (await afterDeact.text()).includes("/portal/login"));
  const blocked = await deact.login("verify1", "Password-verify1-123");
  check("deactivated user cannot sign in", blocked.status === 403, String(blocked.status));
  const out = client();
  await out.login("admin1", "Password-admin1-123");
  await out.post("/api/portal/auth/logout");
  check("logout ends the session", (await out.get("/api/portal/employees/1/photo")).status === 401);

  console.log("\nDelete");
  const victim = ids[2];
  const victimRow = (await sql("SELECT employee_id, certificate_number, certificate_pdf_path FROM employee_certificates WHERE id = ?", [victim]))[0];
  check("Admin cannot delete", (await admin.del(`/api/portal/employees/${victim}`, { confirm: victimRow.employee_id })).status === 403);
  check("Staff cannot delete", (await staff.del(`/api/portal/employees/${victim}`, { confirm: victimRow.employee_id })).status === 403);
  check("delete without the typed confirmation is refused", (await sa.del(`/api/portal/employees/${victim}`, { confirm: "wrong" })).status === 422);
  check("Super Admin deletes", (await sa.del(`/api/portal/employees/${victim}`, { confirm: victimRow.employee_id })).status === 200);
  check("record is gone", (await sql("SELECT id FROM employee_certificates WHERE id = ?", [victim])).length === 0);
  check("its PDF is gone", !fs.existsSync(path.resolve(process.env.STORAGE_DIR, victimRow.certificate_pdf_path)));
  check("its certificate now shows NOT FOUND", (await verifyHtml(`/verify?number=${victimRow.certificate_number}`)).includes(">NOT FOUND<"));
  const fresh = await admin.json(await admin.post("/api/portal/employees", employeeForm({ employee_id: "AFTER-DEL" })));
  const freshCert = await admin.json(await admin.post(`/api/portal/employees/${fresh.id}/assessment`, assessmentForm("Passed", true)));
  check("deleted certificate's number is never reused", freshCert.certificate_number !== victimRow.certificate_number && Number(freshCert.certificate_number.slice(-5)) > Number(victimRow.certificate_number.slice(-5)));

  console.log("\nAudit log");
  const actions = new Set((await sql("SELECT DISTINCT action FROM audit_logs")).map((r) => r.action));
  for (const a of ["auth.login", "auth.login_failed", "auth.logout", "user.create", "user.update", "user.password_reset", "employee.create", "employee.update", "employee.delete", "assessment.update", "assessment.approve", "certificate.issue", "certificate.regenerate", "certificate.renew", "certificate.revoke", "certificate.download", "report.export", "auth.password_reset"]) {
    check(`logged: ${a}`, actions.has(a));
  }
  const allDetails = JSON.stringify(await sql("SELECT details FROM audit_logs"));
  check("logs contain no phone numbers, names or remarks", !allDetails.includes("777 1234") && !allDetails.includes("Amina") && !allDetails.includes("PRIVATE"));
  const del = (await sql("SELECT record_ref FROM audit_logs WHERE action = 'employee.delete'"))[0];
  check("deletion stays in the log after the record has gone", del.record_ref === String(victim));

  console.log("\nHeaders and generated pages");
  const headersRes = await anon.get("/verify");
  check("security headers present", headersRes.headers.get("x-content-type-options") === "nosniff" && headersRes.headers.get("x-frame-options") === "SAMEORIGIN" && (headersRes.headers.get("strict-transport-security") ?? "").includes("max-age"));
  check("sign-in page is not indexed", (await (await anon.get("/portal/login")).text()).includes("noindex"));
  const footer = await (await anon.get("/")).text();
  check("site footer links to verification", footer.includes('href="/verify"'));

  mail.close();
  await db.end();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(` - ${f}`));
    process.exit(1);
  }
})().catch((err) => {
  console.error("Test run stopped:", err);
  process.exit(1);
});

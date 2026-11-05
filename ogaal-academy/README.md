# OGAAL Academy website

Website for **OGAAL Firearms Safety and Responsibility Training Academy**, Mogadishu, Somalia.
*Safety First. Responsibility Always.*

Built with **Next.js 16 (App Router), TypeScript, Tailwind CSS 4** and **Motion** for subtle transitions.

> **Status: pre-launch.** The intended domain `ogaalacademy.so` is **not** presented as live. The confirmed email `info@ogaalacademy.so` is shown on the Contact page and in the footer. Search-engine indexing stays off until `NEXT_PUBLIC_SITE_URL` is set.

---

## 1. Run locally

Requires **Node.js 20.9 or newer**.

```bash
npm install
cp .env.example .env.local   # optional — the site runs without it
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build
npm start                    # http://localhost:3000
```

## 2. Pages

| Route | Page |
|---|---|
| `/` | Home — hero with four icon tiles, intro cards, about preview, training preview, two-day programme, partners, call to action |
| `/about` | About Us — introduction, mission and vision, core values, training approach |
| `/training` | Training — seven programmes and services (`/training#programmes`), Two-Day Programme (`/training#programme`) |
| `/partners` | Partners & Cooperation — Ministry of Internal Security card with agreement status (old `/admissions` redirects to `/contact`) |
| `/certification` | Certification — requirements, what the certificate confirms, trainee conduct |
| `/faq` | FAQs — accessible accordion (old `/faqs` redirects here) |
| `/contact` | Contact — enquiry form and confirmed contact details |
| `/verify` | Public certificate verification (see section 10) |
| `/portal` | Staff portal: sign-in required (see section 10) |

Header navigation: Home, About Us, Training, Partners, Contact + **Enquire Now**. Certification and FAQs are linked from the footer and from relevant buttons.

## 3. Editing content

**Everything editable lives in `src/content/site.ts`:** academy name, navigation, hero text, cards, training programmes, the two-day programme, admission requirements and steps, certification text, FAQs, contact details, image paths.

### Contact details — hidden until confirmed

In `src/content/site.ts → contact`:

| Field | Now | To publish |
|---|---|---|
| `email` | `info@ogaalacademy.so`, **shown** (`confirmed: true`) | set `confirmed: false` to hide it |
| `phone` | `null` (hidden) | e.g. `"+252 61 000 0000"` |
| `whatsapp` | `null` (hidden) | international digits only, e.g. `"25261xxxxxxx"` → creates a wa.me link |
| `streetAddress` | `null` (hidden) | full academy address |
| `openingHours` | `null` (hidden) | e.g. `"Saturday–Thursday, 8:00–16:00"` |
| `social` | empty | add `{ platform, handle, url }` per confirmed profile, for example the @infoogaalacademy account once its platform and link are confirmed |

Only "Mogadishu, Somalia" is shown publicly today. No map location is shown. When you set a confirmed value, it appears on the Contact page, in the footer and in the structured data.

### Fees

The academy's documents show two different fees ($100 and $150), so the site says **"Contact us for confirmed fees"** everywhere. When the fee is confirmed, update `programme.feeText` and the "What is the training fee?" FAQ.

## 4. Logo and artwork

- **Official logo:** `brand/official/OGAAL_Logo_Only.pdf` (as supplied) and `brand/official/ogaal-logo-source.jpg` (the image inside the PDF, unchanged).
  `npm run assets` builds the web files from it. The artwork is never redrawn: only the outer white background is made transparent, and the shield is cropped for the header and favicon.
  - `public/brand/ogaal-logo.png`: the full official logo (footer, structured data)
  - `public/brand/ogaal-mark.png`: the official shield, shown in the header next to the academy name set as text
  - `src/app/icon.png`, `apple-icon.png`, `favicon.ico`: favicons made from the shield
- ⚠️ The supplied logo is a **low-resolution image (522×494 px)**. It is sharp at the sizes used on the site, but for print, signage and high-density screens please supply the **original vector file** (SVG, AI, EPS or PDF with vector paths). Then replace the source and run `npm run assets`.
- **Icons:** the design uses flat line icons only. Firearm-safety icons (cartridge, three cartridges, pistol, pistol with padlock, cartridge with tick, target, rifle) are drawn in `src/components/ArmsIcon.tsx`; everything else comes from Lucide via `src/components/Icon.tsx`. Content files refer to icons by name (for example `icon: "pistol"`).
- **Social sharing image:** `src/app/opengraph-image.png`, rebuilt with `npm run og` (uses the official logo).
- No photographs or 3D renders are used.

## 5. Enquiry forms and email delivery

The **contact form** (`/contact`) posts to the server route `src/app/api/enquiry/route.ts`: Full Name, Email Address, Phone (optional), Enquiry Type (Training, Admissions, Organisational Training, Certification, General), Message, consent. The admissions form code (`kind="admissions"`) remains in `EnquiryForm.tsx` and `src/lib/enquiry.ts` but no page uses it.

What the server does:
- Applies the same validation as the browser (`src/lib/enquiry.ts`).
- Spam protection: a hidden honeypot field, a minimum time to fill in the form, a same-origin check and a size limit.
- Rate limiting: 5 enquiries per 10 minutes per IP address (`src/lib/rate-limit.ts`).
- Emails every enquiry to **info@ogaalacademy.so**. The sender is the academy's own address, and **Reply-To is the visitor's email**, so you can just press Reply.
- Shows the success message only after the mail server accepts the email.
- If email isn't configured, or if sending fails, the form says so clearly, nothing is lost, and the visitor's entries stay in the form.
- Credentials are kept on the server only and are never sent to the browser.

### Connecting the forms to info@ogaalacademy.so

**Option A — the mailbox's own outgoing mail (SMTP). This is the simplest option.**
1. In your email provider, find the **outgoing mail (SMTP)** settings for `info@ogaalacademy.so`.
2. On your hosting (for example Vercel → Project → Settings → Environment Variables), add:
   ```
   SMTP_HOST=<your provider's SMTP server>
   SMTP_PORT=465
   SMTP_USER=info@ogaalacademy.so
   SMTP_PASS=<mailbox password or app password>
   ```
3. Redeploy. The forms switch on automatically, and enquiries arrive in info@ogaalacademy.so.

Common SMTP settings:

| Email provider | SMTP_HOST | SMTP_PORT | Password to use |
|---|---|---|---|
| Google Workspace | `smtp.gmail.com` | 465 | An **App Password** (needs 2-Step Verification) |
| Microsoft 365 / Outlook | `smtp.office365.com` | 587 | Mailbox password (SMTP AUTH must be enabled for the mailbox) |
| Zoho Mail | `smtp.zoho.com` (paid plans: `smtppro.zoho.com`) | 465 | Mailbox password or app-specific password |
| cPanel / web-hosting email | usually `mail.ogaalacademy.so` | 465 | Mailbox password |

**Option B — Resend.** Verify `ogaalacademy.so` in [Resend](https://resend.com), then set `RESEND_API_KEY` and `ENQUIRY_FROM_EMAIL`. If SMTP is also set, SMTP is used.

To also send copies to other inboxes, set `ENQUIRY_TO_EMAIL=info@ogaalacademy.so,admissions@ogaalacademy.so`.

Both options were tested end to end with a test mail server:
- A valid login delivered the enquiry to info@ogaalacademy.so with Reply-To set to the visitor.
- A wrong password showed "could not be sent" and kept the visitor's entries.
- No settings showed "not available yet".

> **Rate limiting on serverless hosting:** the built-in limiter keeps its counts in memory, which is fine on a single server. On Vercel or another multi-instance host, replace `src/lib/rate-limit.ts` with a shared store (for example Upstash Redis with `@upstash/ratelimit`) for a strict limit.

## 6. Deployment

**Public website only:** Vercel works well. **With the certificate portal, see section 10:** it needs a long-running server and a persistent disk, which rules out Vercel.

**Vercel:** import the project, add the environment variables, then deploy. **Any Node host:** `npm ci && npm run build && npm start` behind HTTPS.

When the domain is registered and pointed at the deployment:
- set `NEXT_PUBLIC_SITE_URL=https://ogaalacademy.so` and redeploy. This turns on canonical URLs, the sitemap, `robots.txt` and search indexing, and adds the site URL to the structured data.

## 7. SEO, accessibility and performance

- A unique title and description on every page. The home page title is *OGAAL Academy | Firearms Safety & Responsibility Training*.
- Open Graph and Twitter sharing image, favicon and Apple touch icon.
- `sitemap.xml` and `robots.txt` (indexing blocked until launch).
- `EducationalOrganization` structured data that includes only confirmed details (name, logo, Mogadishu, Somalia). The FAQ page has `FAQPage` structured data.
- Semantic landmarks, a skip link and visible focus rings. The mobile menu has a close button, keeps keyboard focus inside while open, closes with Escape and has large tap targets. The FAQ accordion is fully accessible. Form fields have labels, inline errors and an error summary. Colour contrast meets AA.
- Animation is restrained (reveal on scroll, gently floating labels, menu and accordion transitions) and switches off when the visitor prefers reduced motion. Content stays visible without JavaScript.
- Images are served as AVIF/WebP and load lazily below the fold. The hero image loads first. Fonts are self-hosted.
- Security headers: `nosniff`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`.

## 8. Before launch — what's still needed

| # | Item | Needed from the academy |
|---|---|---|
| 1 | **Domain** | Register `ogaalacademy.so`, deploy, set `NEXT_PUBLIC_SITE_URL` |
| 2 | **Email delivery** | SMTP settings for info@ogaalacademy.so (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) — see section 5 |
| 3 | **Business email** | ✅ `info@ogaalacademy.so` confirmed and shown. Make sure it receives mail (it is also the default `ENQUIRY_TO_EMAIL`) |
| 4 | **Phone / WhatsApp** | Confirmed numbers |
| 5 | **Full address** | Confirmed street address |
| 6 | **Opening hours** | Confirmed hours |
| 7 | **Social media** | Platform and URL for @infoogaalacademy (and any others) |
| 8 | **Training fee** | Confirm the correct fee ($100 or $150) before publishing a price |
| 9 | **Privacy policy** | Approve a policy (the forms collect personal data), add the page, set `site.privacyPolicyHref` |
| 10 | **Vector logo** | Original vector file of the official logo |
| 12 | **Partners** | The Ministry of Internal Security cooperation is shown on `/partners` and the home page **without a status label** (`showStatus: false`). The agreement is not yet signed: confirm with the Ministry that they agree to being listed. Once signed, set `status: "signed"` and `showStatus: true` to show "Signed cooperation agreement". Don’t add the ministry’s emblem without written permission. |

## 9. Content rules followed

The content comes from the academy's supplied documents. The site has **no** testimonials, graduate numbers, success rates, instructor biographies, qualifications, government or partner logos (the one partner is shown as text with its agreement status), course schedules, prices, invented contact details, or map pins. Programme descriptions stay at an educational-overview level.

## 10. Certificate management portal

Staff portal at `/portal`, public certificate checks at `/verify`. It registers employees, records training and authorised assessment results, issues numbered one-year certificates as PDFs with QR codes, and keeps an audit trail.

The public website does not need any of this: with no `DB_*` settings it runs exactly as before, and the portal says it isn't configured.

### Set up

Requires **MySQL 8** (MariaDB 10.4+ also works) and `mysqldump` on the server for backups.

```bash
npm install
cp .env.example .env.local        # fill in the DB_ settings, STORAGE_DIR and PORTAL_BASE_URL
```

Create an empty database and a user for it:

```sql
CREATE DATABASE ogaal_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ogaal'@'localhost' IDENTIFIED BY 'a long random password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, LOCK TABLES ON ogaal_portal.* TO 'ogaal'@'localhost';
```

```bash
npm run db:migrate                # creates the tables; safe to run again
npm run db:create-admin           # creates the first Super Admin; there is no default account
npm run build && npm start
```

Then sign in at `/portal/login` and go to **Settings** to upload the signature and official stamp and replace the placeholder assessment questions. Until a signature and stamp are uploaded, certificates print with blank space to sign and stamp by hand. The system never generates either one.

### Roles

| | Super Admin | Admin | Staff | Verification User |
|---|---|---|---|---|
| Verify certificates | ✓ | ✓ | ✓ | ✓ |
| Register and view employees | ✓ | ✓ | ✓ | |
| Edit a record that has a certificate | ✓ | ✓ | | |
| Record and approve assessments, read assessment notes | ✓ | ✓ | | |
| Generate, download, print, renew, revoke certificates | ✓ | ✓ | | |
| Reports, exports, activity logs | ✓ | ✓ | | |
| Manage users | All roles | Staff and Verification only | | |
| Renew a revoked certificate | ✓ | | | |
| Delete employees | ✓ | | | |
| Settings | ✓ | | | |

A user with an **Assigned Company** sees and handles that company's records only. Leave it empty for access to all companies. Super Admins are never limited.

### How certificates work

- A certificate is issued automatically when a record has a training date and a **passed, approved** assessment. Staff cannot record assessments.
- Numbers look like `CERT-2026-00001`. They come from an atomic per-year counter, so they are never repeated, even after a record is deleted.
- Issue date is today in `APP_TIMEZONE`; expiry is one year later. A certificate is valid through its expiry date.
- The server marks expired certificates hourly with nobody logged in. `/verify` also checks the date itself on every request.
- Renewing issues a new number and PDF. The previous certificate stays in the record's `certificate_history`, can still be downloaded, and verifies as replaced.
- Changing a printed field regenerates the PDF under the same number.
- Exports stop at 20,000 rows for Excel and 5,000 for PDF. The PDF states when it hits its limit.
- QR codes link to `PORTAL_BASE_URL/verify/c/<random token>`, so **set `PORTAL_BASE_URL` to the real domain before issuing certificates**. QR codes on PDFs already handed out cannot change.

### Database

`employee_certificates` holds all employee, training, assessment and certificate data in one row per employee, including earlier certificates. `users` holds accounts. Four supporting tables hold no employee records: `user_sessions`, `password_resets`, `audit_logs` and `system_settings`. `schema_migrations` tracks applied migrations. To change the schema, add a new numbered file in `db/migrations/`.

### Deployment

The portal needs a **long-running Node.js 20.9+ process, a persistent disk and MySQL**, behind an HTTPS proxy such as nginx. Serverless hosting such as Vercel is not suitable: its disk does not persist, so photos and PDFs would be lost, and the hourly job and in-memory rate limits would not run reliably. Check that your Cloudways plan can run a long-lived Node.js process. If it can't, use a VPS.

- Keep `STORAGE_DIR` and `BACKUP_DIR` outside the deployment folder, so a redeploy can't delete them, and never under `public/`.
- Run one server process. Rate limits are held in memory, so cluster mode would weaken them.
- Have the proxy set the real address, as nginx does with `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, along with `Host`. Without a proxy, a client can forge `X-Forwarded-For`. Behind two proxies, set `TRUSTED_PROXY_COUNT=2`.

### Backup and recovery

With `BACKUP_ENABLED=true` the server takes a backup every 24 hours. `npm run backup` runs one by hand. Each run writes a compressed database dump and a file storage archive to `BACKUP_DIR`, deletes those older than `BACKUP_RETENTION_DAYS` (default 30), and reports the result on the dashboard and in Settings, which warn if the last backup failed or is over 36 hours old.

Backups hold personal and assessment data and are **not encrypted**. Copy them to separate, access-controlled storage: a backup on the same disk won't survive losing that disk. Never put them in Git.

To recover:

```bash
gzip -dc ogaal-db-<timestamp>.sql.gz | mysql -u ogaal -p ogaal_portal
tar -xzf ogaal-files-<timestamp>.tar.gz -C /path/to/STORAGE_DIR
```

Then start the app, sign in and open a certificate PDF to confirm. Practise this on a spare database from time to time.

### Security notes

- Passwords are hashed with scrypt. Session and reset tokens are stored only as hashes.
- Every API route goes through `portalRoute` in `src/lib/portal/api.ts`, which checks origin, session and permission. Company limits are enforced in `getEmployee` and `buildWhere`.
- Uploaded images are decoded and re-encoded, which rejects non-images and strips metadata. Files are served only through permission-checked routes.
- Public verification reads a fixed list of columns that excludes private fields. Because certificate numbers run in sequence, someone can still look up names by guessing numbers, up to the limit of 30 checks per 10 minutes per address.
- **This repository is public.** `.gitignore` excludes `.env*`, `storage/`, `backups/` and archives. Never commit real data, and keep `.env.example` to placeholders.

### Testing

`npm run test:portal` runs about 200 end-to-end checks over HTTP. It refuses to run unless `DB_NAME` ends in `_test`, and it needs an empty migrated database, a Super Admin, a running server and the variables listed at the top of `scripts/test-portal.cjs`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop / build / serve |
| `npm run assets` | Build logo web files and favicons from the official logo |
| `npm run og` | Rebuild the social sharing image |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:create-admin` | Create a Super Admin |
| `npm run backup` | Back up the database and private files |
| `npm run test:portal` | End-to-end portal tests (test database only) |

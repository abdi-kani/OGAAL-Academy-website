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
| `/` | Home — hero with 3D artwork, intro cards, about/training/programme/admissions previews, call to action |
| `/about` | About Us — introduction, mission, vision, core values, training approach |
| `/training` | Training — seven programmes and services, Two-Day Programme (`/training#programme`) |
| `/partners` | Partners & Cooperation — Ministry of Internal Security card with agreement status (old `/admissions` redirects to `/contact`) |
| `/certification` | Certification — requirements, what the certificate confirms, trainee conduct |
| `/faq` | FAQs — accessible accordion (old `/faqs` redirects here) |
| `/contact` | Contact — enquiry form and confirmed contact details |

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
- **3D artwork:** the hero image (shield with check mark, open book, silver rings, blue spheres, podium) and the three small 3D icons are real 3D renders, saved as optimised static WebP images in `public/images/3d/`. The scene is in `scripts/render3d/scene.html`; re-render with `npm run render3d` (needs Playwright's Chromium). Text and buttons are always real HTML.
- **Social sharing image:** `src/app/opengraph-image.png`, rebuilt with `npm run og`.

### Photographs

No photographs are included. The About page has one slot, which shows a clearly labelled placeholder until a **licensed** photo is supplied. To add one, put the file in `public/images/`, then set `photos.classroom.src` in `src/content/site.ts`. A shot brief is included next to each slot.

## 5. Enquiry forms and email delivery

Two forms post to the server route `src/app/api/enquiry/route.ts`:
- **Contact form** (`/contact`): Full Name, Email Address, Phone (optional), Enquiry Type, Message, consent.
- **Admissions enquiry** (`/admissions`): Full Name, Email, Phone, Individual or Organisation, Organisation Name (only for organisations), Message, consent. It is an enquiry, not an application. The form tells visitors **not** to send ID documents, criminal-record or medical details, and it has no upload fields.

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

**Vercel (recommended):** import the project, add the environment variables, then deploy. **Any Node host:** `npm ci && npm run build && npm start` behind HTTPS.

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
| 11 | **Photographs** | Licensed photos of adult learners and instructors (optional; one slot on About) |
| 12 | **Partners** | The Ministry of Internal Security cooperation is shown on `/partners` and the home page **without a status label** (`showStatus: false`). The agreement is not yet signed: confirm with the Ministry that they agree to being listed. Once signed, set `status: "signed"` and `showStatus: true` to show "Signed cooperation agreement". Don’t add the ministry’s emblem without written permission. |

## 9. Content rules followed

The content comes from the academy's supplied documents. The site has **no** testimonials, graduate numbers, success rates, instructor biographies, qualifications, government or partner logos (the one partner is shown as text with its agreement status), course schedules, prices, invented contact details, map pins, or certificate verification tool. Programme descriptions stay at an educational-overview level.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop / build / serve |
| `npm run assets` | Build logo web files and favicons from the official logo |
| `npm run render3d` | Re-render the 3D hero artwork and icons |
| `npm run og` | Rebuild the social sharing image |

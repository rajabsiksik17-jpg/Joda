# Quality Experts — Corporate Website & CMS

Bilingual (Arabic RTL / English LTR) corporate website and content-management system for
**خبراء الجودة للاستشارات والتدريب — Quality Consulting & Training**, Amman, Jordan.

All company content (services, capabilities, vision, CEO message, statistics, partners, clients,
contact details) was taken from the official 2026 company profile and visual identity guide, and is
editable in the CMS. Nothing in the content was invented — see [Content notes](#content-notes) for
items that still need the company's confirmation.

---

## Contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How the CMS works](#how-the-cms-works)
- [Security](#security)
- [SEO, performance & accessibility](#seo-performance--accessibility)
- [Testing](#testing)
- [Deployment](#deployment)
- [Content notes](#content-notes)

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`), React 19, TypeScript |
| Database | PostgreSQL + Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Styling | Tailwind CSS v4 with brand tokens (navy `#071f3f`, technical blue `#168fc1`, light blue `#3AB4E0`, grey `#ADB9C3`) |
| Fonts | Cairo (Arabic headings), Tajawal (Arabic body), Cormorant Garamond (English display) — per the identity guide — plus Inter for English UI text |
| Admin UI | Radix primitives, dnd-kit (drag & drop), TipTap (rich text), Sonner (toasts) |
| Auth | Argon2id passwords + e-mailed one-time codes, DB sessions, RBAC |
| E-mail | Nodemailer (SMTP), ImapFlow (IMAP connection test) |
| Media | Sharp (re-encoding, EXIF stripping, resizing), DOMPurify (SVG sanitising) |
| Tests | Vitest (unit + DB integration), Playwright (end-to-end, desktop + mobile) |

## Quick start

Requirements: **Node.js 20.9+** (22 recommended) and **PostgreSQL 15+**.

```bash
npm install
```

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` and `AUTH_SECRET` in `.env`, then create the schema and load the official content:

```bash
npm run db:deploy
```

```bash
npm run db:seed
```

The seed prints the Super Admin e-mail and (if `SEED_ADMIN_PASSWORD` was empty) a temporary password.

```bash
npm run dev
```

- Website: http://localhost:3010 (redirects to `/ar` or `/en` by browser language)
- CMS: http://localhost:3010/admin

**Signing in locally without SMTP:** sign-in codes are written to `storage/mail-outbox/*.json`
(development only). In production an SMTP server must be configured (CMS → Email, or the `SMTP_*`
variables), otherwise nobody can sign in.

**Locked out?** Create a Super Admin or reset a password from the server:

```bash
npm run user:create -- --email you@qc-jo.com --name "Your Name"
```

```bash
npm run user:create -- --email you@qc-jo.com --reset
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3010 |
| `npm run build` / `npm start` | Production build / server (`PORT` env var sets the port) |
| `npm run db:migrate` | Create & apply a new migration during development |
| `npm run db:deploy` | Apply migrations (production / CI) |
| `npm run db:seed` | Roles, settings, first admin; content only if the DB has no pages. `-- --force` recreates content |
| `npm run user:create` | Create a Super Admin / reset a password (see above) |
| `npm run typecheck` · `npm run lint` | TypeScript · ESLint |
| `npm test` | Unit + integration tests (uses the `_test` database) |
| `npm run test:e2e` | Playwright end-to-end tests (desktop + mobile) |

## Project structure

```
prisma/
  schema.prisma          Data model (pages, sections, services, people, blog, media, auth, audit…)
  seed.ts                Seed logic   ·  seed-content.ts  Official company content
  seed-assets/           Official images (CEO portrait, partner logos)
public/brand/            Official logo variants, favicons, default sharing image
src/
  proxy.ts               Locale detection/redirects, optimistic admin gate
  app/
    [locale]/            Public website (root layout per language, RTL/LTR)
      [[...slug]]/       Any CMS page (home, about, services, contact, legal, custom pages)
      services/[slug]/   Service detail template
      insights/[slug]/   Article template
      search/  preview/[id]/
    admin/(auth)/        Sign-in + verification code
    admin/(panel)/       CMS screens (dashboard, pages, services, insights, media, collections,
                         navigation, contact, SEO, settings, messages, users, roles, e-mail, audit, account)
    api/admin/           Media upload/replace, global search, CSV export
    uploads/[...key]/    Serves uploaded media with strict headers
    sitemap.ts robots.ts manifest.ts
  components/
    site/                Header, footer, network-globe visual, forms, map, consent…
    sections/            One component per page-builder section type
    admin/               UI kit, field renderer, page builder, media library, collection manager
  lib/
    sections/            Section registry + declarative field system (drives forms AND validation)
    auth/                Sessions, OTP, permissions, passwords
    content/             Cached public data access
    admin/               Collection/settings/entity definitions for the CMS
    email/ media/        Mailer, templates, IMAP test · storage, processing, usage tracking
tests/unit  tests/e2e
```

## How the CMS works

### Pages & the page builder
Every page (Home, About, Services, Clients & partners, Insights, Contact, legal pages, and any new
page) is a list of **sections**. 26 section types are available (hero, page header, text & media,
rich text, statement/vision, feature cards, process/timeline, FAQ, statistics, leadership message
(single, rotating or side-by-side), team (profile cards with a profile side panel), partners,
services showcase/grid, clients, testimonials, latest insights, insights listing, CTA, contact,
contact channel cards, consultation request form, map, video, gallery, logo cloud, spacer). Editors can add, reorder (drag & drop),
duplicate, hide, save as reusable templates, and edit each section's content and design
(background, spacing, anchor, hide on mobile/desktop).

**Draft → publish:** editing never touches the live site. *Save draft* stores changes; *Preview*
(or the side-by-side live preview with desktop/tablet/mobile widths) shows them; *Publish* freezes a
snapshot that the public site serves and records a **revision**. Any revision can be restored.

### Bilingual content
Every text field is stored as `{ ar, en }` and edited side by side. Arabic inputs are RTL. A page
or article in only one language simply doesn't appear in the other. Adding a language later needs no
database migration.

### Collections
Services (introduction, why it matters, outcome cards, capability groups with five layouts — grid,
tabs, group columns, timeline, standards wall —, methodology steps, hero illustration, related
services, SEO), Insights (rich text,
categories, tags, scheduling by publication date), Team & leadership (position, department, short
and full biography, areas of expertise, leadership message, featured flag, LinkedIn and other
profiles, public e-mail/phone, active toggle), Partners, Clients & markets,
Testimonials, FAQs (optionally attached to services), Statistics, Contact channels, Social links —
all orderable by drag & drop, with visibility toggles. Sections that would be empty (e.g.
testimonials, latest insights) hide automatically.

### Other admin areas
Navigation (header with mega-menu & dropdowns, footer, legal links), Contact details & map,
SEO (defaults, verification codes, content-health report), Settings (general, brand assets,
header, footer, analytics, maintenance mode, sign-in security), Contact details (channels, social
profiles, map, notification recipients, **floating buttons** — contact speed-dial and WhatsApp with
side and mobile/desktop visibility — and consultation form options), **Consultation requests**
(search; filters by status, service and country; Pending → Contacted → Completed; archive, delete,
internal notes, CSV export), Messages (inbox with search, filters, notes, bulk actions, CSV export), Users, Roles & permissions, E-mail (SMTP/IMAP with
connection tests and test send), Audit log, My account (password, sessions). `Ctrl/⌘ + K` opens
global search.

### Roles
| Role | Can |
| --- | --- |
| Super Admin | Everything (always) |
| Admin | Everything except editing roles |
| Editor | Create & publish pages, services, insights, collections, media, navigation, SEO; read messages |
| Content Manager | Prepare drafts (pages, insights, collections, media) — cannot publish |

Roles are editable and custom roles can be created. Permissions are enforced on the server in
every page, action and API route.

## Security

- **Sign-in:** e-mail + password (Argon2id). A 6-digit e-mailed code is added **only when outgoing
  e-mail is active** — configured, successfully tested with exactly the saved settings, and enabled
  (Admin → Email shows *Not configured / Configured, not verified / Active / Disabled* plus the IMAP
  status). Until then sign-in uses the password only and nobody can be locked out by a broken mail
  server. Policy (Settings → Security): codes for **new or unrecognised browsers** (default), every
  sign-in, or off. Recent failed attempts on the account also trigger a code. After verification a
  browser can be trusted for N days (random token in an `HttpOnly` cookie, only its hash stored,
  bound to the browser family); users see and revoke trusted browsers under My account, and
  password changes/resets revoke them.
  Codes are cryptographically random, HMAC-hashed at rest, bound to their challenge, single-use
  with atomic consumption, 5-minute expiry, 5 attempts, 60 s resend cooldown, max 5 resends — all
  configurable — and are never logged or shown in the dashboard. Identical error messages for
  unknown accounts; per-IP and per-account rate limits; temporary account lockout.
  Emergency switch: `AUTH_DISABLE_OTP=true` in the environment disables codes (e.g. if the mail
  provider is down) — remove it afterwards.
- **Sessions:** opaque random token in an `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookie;
  only its SHA-256 is stored. Revocable per device; password changes sign out other devices.
- **Authorization:** RBAC checks inside every server action/route; the proxy only does an
  optimistic redirect. Super Admin protections (no self-demotion, last Super Admin kept).
- **Input:** zod validation on the server for every write; rich text sanitised on save; links
  restricted to safe schemes; SQL via Prisma/parameterised queries only.
- **Uploads:** type detected from file bytes (never the name/MIME header), size limits, images
  re-encoded by Sharp (metadata stripped), SVGs sanitised and rejected if they reference external
  resources, served from outside `/public` with `nosniff` and a sandboxing CSP; path traversal blocked.
- **Headers:** CSP, HSTS (production), `X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'self'`,
  `nosniff`, strict Referrer-Policy, Permissions-Policy. Route handlers that change state also
  verify the `Origin` (CSRF); server actions use Next's built-in origin check.
- **Contact & consultation forms:** honeypot, signed time-to-fill token, per-IP and per-e-mail rate
  limits, consent recorded; e-mails sent after the response. Consultation phone numbers are
  validated per country with libphonenumber and stored in E.164; only published services can be
  referenced. The visitor's country is guessed without asking for location: CDN geo headers
  (Cloudflare/Vercel/CloudFront) when present, otherwise the browser's time zone, then the configured
  default (Jordan).
- **Secrets:** SMTP/IMAP passwords encrypted with AES-256-GCM, never sent to the browser.
- **Audit log:** sign-ins (success/failure/lockout), code requests, and every content, settings,
  user and role change, with user, IP and metadata.

> CSP keeps `'unsafe-inline'` for scripts because Next.js injects inline bootstrap scripts; a
> nonce-based CSP would force every page to render dynamically per request. Everything else is
> locked down.

## SEO, performance & accessibility

- Per-page/service/article titles, descriptions, sharing images, `noindex`; canonical URLs and
  `hreflang` (incl. `x-default`); dynamic `sitemap.xml` with language alternates; `robots.txt`;
  JSON-LD (ProfessionalService organisation, Service + offer catalogue, Article, BreadcrumbList,
  FAQPage); real HTTP 404s.
- Server Components by default; public data cached and invalidated on publish (`updateTag`);
  production TTFB ≈ 30–80 ms locally; `next/image` (AVIF/WebP); fonts self-hosted by `next/font`.
  Public JS ≈ 207 KB gzipped, mostly the React/Next.js runtime.
- Animations respect `prefers-reduced-motion`; the hero canvas pauses off-screen.
- Skip link, semantic landmarks, keyboard-accessible menus/tabs/dialogs (focus trapping, Escape),
  labelled form fields with announced errors, visible focus styles, AA colour contrast.
- Privacy: no tracking by default. When analytics (GA4/Plausible) is enabled, nothing loads until
  the visitor accepts. Google Maps and videos load only on request.

## Testing

```bash
npm test
```

53 unit/integration tests: crypto, passwords, roles, OTP lifecycle (single use, expiry, attempt
lockout, rotation, race safety), e-mail status state machine (not configured / unverified / active /
disabled, OTP policy, emergency switch), trusted-browser families, consultation phone
normalisation & validation, localized country lists, rate limiting, sanitising, upload type detection & SVG safety,
storage key traversal, contact validation, page-builder schemas, i18n, links, settings defaults.
They run against a separate `<database>_test` database and refuse to run against any other.

```bash
npm run test:e2e
```

Playwright tests (desktop + Pixel 7): language redirect & persistence, RTL/LTR, no horizontal
overflow, services & capabilities, real 404s, language switcher, contact form, consultation form
(country detection, phone validation, searchable country picker), team profile dialog, mobile
services accordion, search, mobile menu, SEO files, security headers, admin auth gate,
enumeration-safe errors, wrong OTP (skipped while e-mail is not active), full sign-in,
consultation request → admin search, status, notes, delete, page edit → draft → publish → live → restore, upload validation,
and role restrictions for a Content Manager. They run against the dev server and read codes
from the dev mail outbox.

## Deployment

The app is a standard Node.js Next.js server.

1. Provision PostgreSQL (media is stored in it by default; set `STORAGE_DRIVER=local` and a
   persistent `UPLOAD_DIR` to keep files on disk instead).
2. Set environment variables (see `.env.example`) — at minimum `DATABASE_URL`, `AUTH_SECRET`,
   `NEXT_PUBLIC_SITE_URL`, `UPLOAD_DIR`, and `TRUST_PROXY=true` behind a proxy.
3. Install, migrate, seed (first time only), build, start:

```bash
npm ci
```

```bash
npm run db:deploy
```

```bash
npm run db:seed
```

```bash
npm run build
```

```bash
npm start
```

4. Serve over **HTTPS** (secure cookies and HSTS assume it). Put Nginx/Caddy or a load balancer in
   front; allow request bodies up to ~65 MB for video uploads.
5. Sign in, open **Email** and configure + test SMTP (required for sign-in codes and notifications).
6. Back up the database (it includes uploaded media unless `STORAGE_DRIVER=local`).

Running several instances: sessions, rate limits, uploads and the content cache are all
DB/Next-backed, so instances can be added behind a load balancer.

### Moving to another server

Uploaded media (images and videos) is stored **in the database** by default (`STORAGE_DRIVER=db`),
so the database is the only thing to move:

```bash
pg_dump --format=custom --no-owner --file=quality_experts.dump "$DATABASE_URL"
```

```bash
pg_restore --no-owner --dbname "$NEW_DATABASE_URL" quality_experts.dump
```

Then deploy the code on the new server with the same `AUTH_SECRET` (it decrypts the stored SMTP/IMAP
passwords) and run `npm run db:deploy`. Sites that used `STORAGE_DRIVER=local` can import their
existing files once with `npm run media:to-db`.

## Content notes

Items the company should confirm or supply (all editable in the CMS):

1. **CEO name in Arabic** — the profile gives only “Eng. Nael Saadeh”; the site uses «م. نائل سعادة».
2. **Service 10 naming** — the profile lists “ISO Consulting” but its detail pages cover *Global ISO
   Compliance* and *Institutional Excellence*; the Arabic title used is «استشارات الأيزو والتميز
   المؤسسي».
3. **Service categories** (Governance & Strategy, Digital & AI, Finance & Efficiency, People &
   Capability, Quality & Excellence) are an information-architecture grouping, not from the profile.
4. **Kastana** appears on the profile's partner page without description — shown as a partner,
   while DMC Arabia is the featured strategic partner.
5. **Client logos** — the profile says high-quality logos will be sent; clients show as names until
   logos are uploaded (Clients → edit → Logo).
6. **Office landline +962 6 401 7031** (from the previous website, not in the 2026 profile) is
   stored but hidden. Working hours, exact map coordinates and social media accounts were not
   provided.
7. **Legal pages** — the privacy and cookie notices describe exactly what this website does; have
   them reviewed. *Terms & conditions* is a draft awaiting the legal advisor's text.
8. Short summaries for service cards and the Arabic statistic labels were derived from the official
   service descriptions; review wording as needed.
9. **Insights** — no articles exist yet; the Insights page shows a short "coming soon" message and
   the home-page slider stays hidden until the first article is published.

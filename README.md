# صحيفة — Sahifa

A client-facing request portal for a Kuwaiti law office. Clients sign in, fill an
Arabic form, and submit a request. The lawyer sees every submitted field, corrects
anything that needs correcting, clicks **إصدار الصحيفة**, and gets the finished
petition as a Word file — the office's own document, with the variable parts filled in.

The first case type is **صحيفة دعوى إخلاء ومطالبة بمتأخر أجرة** (eviction for
non-payment of rent). The template engine underneath is generic, so a second case
type is a new `.docx` plus a new `TemplateDef` — no changes to the auth, request,
review or generation code.

---

## Stack

Built to `STACK.md`, with the version rule applied on 29 Aug 2026:

| | |
|---|---|
| Framework | Next.js **16.3.4**, App Router, React **19.2.8** |
| Language | TypeScript strict |
| Data | Prisma **7.10.0** + PostgreSQL on Neon (pooled `DATABASE_URL`, direct `DIRECT_URL`) |
| Auth | Hand-rolled — `bcryptjs` + `jose`, JWT in an httpOnly `sameSite=strict` cookie |
| Validation | `zod` on every server action |
| Styling | Plain CSS custom properties, KUFPEC blue tokens, RTL, Cairo/Inter |
| Documents | `docxtemplater` + `pizzip` |
| Email | `resend` (optional) |
| Deploy | Vercel |

### Deviations from STACK.md — all deliberate

1. **Next 16 / Prisma 7 instead of 15 / 6.** The version-pinning rule says to
   search for current secure versions at the start of every build. Next.js
   shipped 16.3.3 on 25 Aug 2026 fixing two critical RCEs (`GHSA-2xp9-vwfh-vxw4`,
   `CVE-2026-75604`); 16.3.4 is the current patch. Prisma's `latest` npm tag is
   an **8.0.0 release candidate**, so the ORM is pinned to 7.10.0, the last
   stable v7.
2. **`proxy.ts`, not `middleware.ts`.** Next 16 renamed it; `middleware.ts` is
   deprecated. Same job, same matcher config, now on the Node runtime.
3. **One route handler.** `app/api/documents/[id]/route.ts` streams the generated
   `.docx`. A server action cannot return a binary download. Everything else —
   every read and every mutation — is RSC + server actions, no REST.
4. **Prisma 7 specifics.** The client is generated into `lib/generated/prisma`
   (gitignored) and imported from there; `@prisma/client` no longer exports one.
   A driver adapter (`@prisma/adapter-pg`) is now mandatory. Datasource URLs moved
   from `schema.prisma` to `prisma.config.ts`, which loads `.env` itself.
5. **Font.** Inter has no Arabic glyphs; Cairo is loaded for Arabic with Inter
   kept for Latin text and reference numbers. All colour tokens are unchanged.

---

## Setup

```bash
npm install                 # postinstall runs `prisma generate`
cp .env.example .env        # then fill it in — see below
npm run db:push             # create the tables in Neon
npm run db:seed             # load the .docx template + create the admin account
npm run dev
```

### Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** URL — used by the app at runtime |
| `DIRECT_URL` | yes | Neon **non-pooled** URL — used by the Prisma CLI |
| `JWT_SECRET` | yes | ≥ 32 chars. Generate it yourself: `openssl rand -base64 48`. Validated on first use, not at import, so a missing value fails the request — never the build. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | for seeding | The lawyer's login. Without them the seed creates no accounts. |
| `SEED_CLIENT_EMAIL` / `SEED_CLIENT_PASSWORD` | optional | A test client account |
| `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | optional | Email notifications; without them the app logs and carries on |
| `APP_URL` | optional | Used in notification links |

No secret is generated for you — create them yourself and set them in Vercel.

### Deploy on Vercel

Set the same variables in the project settings, then deploy. The build script is

```
prisma generate && prisma db push && tsx prisma/seed.ts && next build
```

so a deploy always syncs the schema and re-seeds the template from
`templates/eviction-petition.docx`. The seed is idempotent (upserts only).

---

## How the document is produced

`scripts/build_template.py` reads the office's original file
(`scripts/source-eviction-petition.docx`), finds every yellow-highlighted run,
and rewrites it as a `{placeholder}` — keeping the fonts, RTL layout, the header
table, the office block and the footer byte-for-byte. Re-run it whenever the
lawyer edits the master document:

```bash
npm run template:build      # rewrites templates/eviction-petition.docx
npm run db:seed             # pushes the new version into the database
```

The template lives in the `CaseTemplate` table, not on disk, so the office can be
given an upload screen later without a redeploy. Generated documents are stored
in `Document` with a version number — regenerating never overwrites an earlier file.

### Fields → document

| Field | Where it lands |
|---|---|
| `plaintiff_name` | `بناء على طلب/ …` in the header table (multi-line) |
| `defendant_name` | the `أعلنت:` line |
| `defendant_address` | `ويعلن في: …` |
| `premises_lead` + `premises_address` | `يستأجر المعلن إليه من الطالب …` |
| `lease_day_name` + `lease_date` | `بموجب عقد إيجار مؤرخ في …` and بند أولاً |
| `property_use`, `monthly_rent` | `بغرض استعمالها كـ (…) لقاء أجرة شهرية قدرها …` |
| `nonpayment_start_date` | `من تاريخ …` |
| `arrears_from_month` / `to` / `year` | the arrears sentence and بند ثانياً |
| `include_eviction_request` | بند أولاً appears or is removed |
| `include_penalty_clause` | بند ثالثاً appears or is removed |

**Computed, never typed:** month count, total (`rent × months`), the month list
(`3 و 4 و 5 و 6 و 7 و 8`), the مقابل الانتفاع start date (first day of the month
after the last unpaid one), the penalty amount (equal to the arrears total), the
Arabic amount-in-words (تفقيط), and the demand ordinals — `أولاً/ثانياً/ثالثاً/رابعاً`
are assigned at render time, so dropping an optional demand renumbers the rest.

Every computed value is shown on the lawyer's review screen and can be overridden
by hand before generating.

### تفقيط

`lib/tafqeet.ts` writes amounts in the oblique case the petition uses
(`أربعمائة وسبعين`, `ألفين وثمانمائة وعشرين`), with nominative forms available.
Fils are supported. `scripts/smoke.ts` asserts the exact strings from the office's
own document.

---

## Security notes

- The JWT carries **only** the user id. Role and `active` are read from the
  database on every request, so deactivating a user takes effect immediately.
- `proxy.ts` verifies the signature and redirects unauthenticated traffic. It is
  **not** the security boundary: `requireUser()` / `requireAdmin()` run inside
  every page and every server action, because server actions are reachable by
  direct POST.
- Document downloads are authorised per document — a client can only fetch files
  belonging to their own request.
- Every mutation writes an `AuditLog` row (login success/failure, submission,
  review, generation, download, rejection) with actor and IP.

---

## Verification performed

```bash
npx tsc --noEmit        # clean
npx next build          # clean — 8 routes + proxy
npx tsx scripts/smoke.ts # 24 assertions: تفقيط, derived values, renumbering, render
```

`scripts/smoke.ts` renders `sample-output.docx` from the exact case in the
office's original file; its wording matches the source document.

**Not verified here:** anything requiring a live database. This sandbox cannot
reach `binaries.prisma.sh`, so `prisma generate`, `db push` and the seed have not
been executed — run them once against Neon before trusting the first deploy. To
let the type-check and build run, `lib/generated/prisma/client.{d.ts,js}` holds a
hand-written stub; `prisma generate` overwrites it (and the directory is
gitignored, so it is not part of the repository).

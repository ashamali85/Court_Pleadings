# Working on Sahifa

Read this before changing anything. It records decisions that have already
been made, so they do not have to be re-argued or rediscovered.

## Adding a new pleading type (صحيفة دعوى)

The office will keep asking for new case types. Every one of them follows the
same shape, and two parts of it are not negotiable.

### 1. The two parties are always identical

**المدعي and المدعى عليه are the same on every pleading type: the same fields,
the same dropdowns, the same validation, in the same order.** The office asked
for this explicitly, and it is the thing most likely to drift if each case type
is written from scratch.

There is exactly one definition, in `lib/templates/party.ts`. A template builds
its party sections like this and adds nothing of its own:

```ts
sections: [
  partySection(PLAINTIFF),
  partySection(DEFENDANT, [fields.defendant_address]), // extras = facts about the CASE
  // …this case type's own sections
]
```

and spreads `partyShape` into its schema under the `plaintiff_` and
`defendant_` prefixes, and runs `validateParty` over `PARTY_SIDES` in its
`superRefine`. Copy the eviction petition if in doubt.

`scripts/form-check.tsx` walks every registered template and fails unless both
sections are exactly what `partySection()` produces. Do not work around it: if
a new case type genuinely needs a different party question, the question
belongs in `party.ts` for everyone, or it is a fact about the case rather than
about the party and belongs in the case's own section.

A side can hold up to `MAX_PARTIES` parties. The sections for all of them
exist in the template; `<side>_count` says how many are drawn, the + on the
last one raises it, and the × removes one and moves the ones after it up. Each
party is complete under its own prefix (`plaintiff`, `plaintiff2`…), so a
second claimant has its own صفة and its own heirs list. `partyKeys()` and
`sideDefaults()` generate the schema keys and the defaults for all of them; the
numbered copies share the first one's wording on the content screen, via
`baseFieldName()`.

The one difference between the sides, everywhere: **جهة حكومية is offered to
المدعى عليه only** (`PRIVATE_PARTY_TYPES` versus `PARTY_TYPES`). A government
body can be sued through this portal; it does not sue through it.

### 2. The form is shared; the wording is not

`party.ts` holds the data, the fields and the rules. It does **not** hold the
sentence a document writes about a party — the eviction petition and the
financial claim describe the same company in different words, and both are the
office's own approved wording. Each pleading keeps its own party prose
(`partyLine` in `eviction.ts`, in `lib/claim/compose.ts`).

Every one of those sentences is pinned character-for-character against a
document the lawyer has signed. Never "improve" the Arabic; if it looks wrong,
ask.

## The rest of the checklist

- `lib/templates/<name>.ts` — a `TemplateDef`: schema, defaults, sections,
  `derive`, `overridable`, `summary`, `acceptsAttachments`.
- Register it in `lib/templates/index.ts`. Labels, hints and the case-type
  explanation become editable on `/admin/content` automatically.
- `templates/<key>.docx` — the Word template. A case type without one still
  works: clients can submit, and the review screen says the template is
  missing. The seed does not fail.
- Office facts the client cannot know (a court name, a filed case number) are
  fields marked `adminOnly`: the request form drops them and the review screen
  shows them.

## الأعمال الداخلية (/admin/internal)

The office's own work, as opposed to the requests clients send in. The list is
the lawyer's to maintain, so it is a table (`InternalJob`) rather than code:
they add, rename, reorder, hide and delete on `/admin/internal/manage`, and a
job's page exists at `/admin/internal/<id>` the moment it is saved. No deploy
is involved in adding one.

`isPlanned()` in `lib/internal/jobs.ts` is the one place that decides whether
a job's page says «قيد الإعداد» — today every job does, because the pages are
scaffolding until the office says what each one produces. When a job gets real
behaviour, that is the function to narrow.

The lawyer's three areas are `/admin/internal`, `/admin/requests` (the inbox)
and `/admin/content`; `/admin` is the welcome page that points at them.

## Conventions worth keeping

- **Arabic is the product.** Labels, errors and documents are Arabic; code and
  comments are English.
- **Measure, don't guess.** Contrast ratios, text widths and rendered markup
  are checked, not eyeballed. `scripts/form-check.tsx` renders components with
  `react-dom/server` precisely so that "what the client is shown" is testable.
- **A hidden field submits nothing.** `showWhen` unmounts, so a value with no
  visible field is a value that silently disappears on the next submit. This
  has caused one data-loss bug already (see the legacy `_name` field).
- **Never reformat `docs/`.** It is the lawyer's own text, verbatim, and the
  specification for everything in `lib/claim/`.

## Running the checks

```
npm run typecheck && npm run smoke && npm run claim:check \
  && npm run form:check && npm run content:check \
  && npm run attachments:check && npm run search:check
```

All seven pass before anything is delivered. `content:check` is the one that
catches a screen asking for wording nobody wrote — that ships as the raw key
printed where a heading should be, and nothing else notices.

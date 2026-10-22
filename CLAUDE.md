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

A side can be one party or several. «أكثر من طرف» holds a list in which each
party has its own صفة — party 1 a company, party 2 a natural person, party 3 a
ministry — so a row is a party in its own right: `rowAsParty()` turns it into
one, and every rule and every sentence then works on it without being written
twice. ورثة is deliberately missing from that list, because heirs are
themselves a list and a list inside a list is a form nobody can fill in; a side
that is entirely heirs picks ورثة as its own صفة.

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
  && npm run form:check && npm run attachments:check && npm run search:check
```

All six pass before anything is delivered.

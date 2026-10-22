# STACK FILE — Criminal-Defense Lawyer-Fee Contract Generator (عقد محاماة – جنايات وجنح)

**Owner:** شركة مكتب علي العريان وحمد الصراف للمحاماة والاستشارات القانونية
**Purpose:** Generate a finished, signed-ready Arabic Word contract (`.docx`) between the law firm and a client accused (or contracting on behalf of someone accused) in a felony/misdemeanor case.
**Status:** Production engine, tested 22 Oct 2026. Developer's job: build the web form + API around it. **Do not edit contract wording or logic** — all legal text has been approved by the lawyer.

---

## 1. Tech stack

| Layer | Requirement |
|---|---|
| Runtime | **Node.js ≥ 18** (tested on Node 22) |
| Library | **`docx` (npm) v9.x** — tested with **9.8.1** → `npm install docx@9.8.1` |
| Engine | **`build_contract.js`** — single file, embedded in full in §10 of this document |
| Templates | **None.** The document is built entirely in code (no .dotx / .docx template files needed) |
| Python | **Not used.** No Python dependencies |
| Fonts (on the *viewer's* machine, not the server) | `AL-Mohanad` (body) and `PT Bold Heading` (headings). Fonts are referenced, not embedded; Word falls back to a default font if missing |
| Optional | LibreOffice (`soffice --headless --convert-to pdf`) if a PDF copy is wanted |

## 2. Target architecture

```
Website form  →  POST /api/contracts (JSON, §4)  →  write JSON to temp file
   →  node build_contract.js <input.json> <output.docx>
   →  return .docx to user (download)  →  delete temp files
```

CLI contract:

```bash
node build_contract.js input.json "عقد محاماة - <client name>.docx"
# stdout on success:  written <output path>
# exit code ≠ 0 on invalid JSON / write error
```

The script reads `process.argv[2]` (input JSON path) and writes `process.argv[3]` (output path). It's synchronous apart from the final `Packer.toBuffer`, so the backend should wait for the process to exit before serving the file. The developer may wrap it as a module later, but the text and logic must stay the same.

## 3. Form flow — questions in order (UI)

The lawyer's workflow asks these **one at a time** (wizard / step-by-step form recommended):

| # | Question (Arabic UI label) | Fields produced |
|---|---|---|
| 0 | تاريخ العقد | `date` |
| 1 | بيانات المتعاقد: اللقب، الاسم، الجنس، الجنسية، الرقم المدني، الهاتف، البريد الالكتروني، العنوان | `client.*` |
| 2 | رقم القضية | `case_no` |
| 3 | وصف القضية | `case_desc` |
| 4 | هل يتعاقد المتهم بنفسه أم شخص آخر لمصلحته؟ | `mode` = `self` / `third_party` |
| 4b | *(only if third_party)* بيانات المتهم: اللقب، الاسم الكامل، الجنس، الجنسية، الرقم المدني، صلة القرابة بالمتعاقد | `accused.*` |
| 5 | قيمة الأتعاب وطريقة السداد: كاملة فور التوقيع / دفعتين / طريقة أخرى | `fees.*` |
| 6 | هل هناك أعمال إضافية علاوة على القضية؟ (نعم → وصفها) | `additional_work` |
| 7 | هل هناك كفيل متضامن؟ (نعم → بياناته كاملة) | `guarantor.*` |

## 4. Input JSON — full parameter reference

### 4.1 Top level

| Key | Type | Required | Allowed values / notes |
|---|---|---|---|
| `mode` | string | yes | `"self"` = accused contracts for himself · `"third_party"` = another person contracts for the accused. Anything other than `"third_party"` is treated as `self` |
| `date` | string | yes | Free Arabic text inserted as-is, e.g. `"22 أكتوبر 2026"` |
| `client` | object | yes | Second party (الطرف الثاني) — see 4.2 |
| `accused` | object | only if `mode = third_party` | See 4.3. Ignored in `self` mode |
| `case_no` | string | yes | e.g. `"123/2026 جنح حولي"` |
| `case_desc` | string | yes | Short description of the charge, e.g. `"إساءة استعمال الهاتف"` (inserted inside parentheses) |
| `fees` | object | yes | See 4.4 |
| `additional_work` | string \| null | no | If non-empty, adds a sentence to the Scope clause: `كما يشمل هذا العقد الأعمال الإضافية الآتية: <text>` — write it as a full Arabic phrase ending with a period |
| `guarantor` | object \| null | no | If present → adds a third party (الطرف الثالث), the joint-guarantee clause, a 3rd signature column, and "three originals". See 4.2 (same fields as client) |

### 4.2 Person object (`client`, `guarantor`)

| Key | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Honorific: `"السيد"` / `"السيدة"` / `"الشيخ"` / `"الدكتور"` … |
| `name` | string | yes | Full name |
| `gender` | `"m"` \| `"f"` | yes | Controls Arabic verb/pronoun agreement (ويقيم/وتقيم، هاتفه/هاتفها، ويشار إليه/إليها). Defaults to masculine if missing |
| `nationality` | string | yes | Adjective form matching gender: `"كويتي"` / `"كويتية"` / `"مصري"` … (inserted before "الجنسية") |
| `civil_id` | string | yes | Kuwaiti civil ID (12 digits). Keep as **string** |
| `phone` | string | yes | Keep as string |
| `email` | string | yes | |
| `address` | string | yes | Free text, e.g. `"الجابرية، قطعة 1، شارع 5، منزل 10"` |

### 4.3 Accused object (`accused`, third_party mode only)

| Key | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | `"السيد"` / `"السيدة"` |
| `name` | string | yes | **Full** name |
| `gender` | `"m"` \| `"f"` | yes | وصلته/وصلتها، ويشار إليه/إليها |
| `nationality` | string | yes | |
| `civil_id` | string | yes | |
| `relation` | string | yes | Relationship **from the client's perspective**, e.g. `"ابنها"`, `"ابنه"`, `"أخوه"`, `"زوجها"`, `"موكله"` |

(No phone/email/address for the accused.)

### 4.4 Fees object

| Key | Type | Required when | Notes |
|---|---|---|---|
| `mode` | string | always | `"full"` (all on signing) · `"two"` (two installments) · `"other"` (custom text). Missing/unknown → yellow placeholder |
| `total` | number | always | Total fee in KWD, **integer** (decimals are rounded). Auto-converted to Arabic words |
| `first` | number | `mode = two` | 1st installment, paid on signing |
| `second` | number | `mode = two` | 2nd installment |
| `second_due` | string | `mode = two` | When the 2nd is due — inserted after "يستحق", e.g. `"بعد مرور ستة أشهر ميلادية من تاريخ التوقيع على هذا العقد"` or `"في موعد أقصاه 1 يناير 2027"` |
| `other_text` | string | `mode = other` | Full Arabic description of the payment arrangement, ending with a period |

**Validation the website should enforce** (the engine does NOT check these): `first + second = total`; numbers are positive integers ≤ 999,999 (the number-to-words function supports up to that); required fields non-empty.

### 4.5 Fixed values — NOT parameters (hard-coded, do not expose in the form)

- First party (الطرف الأول) — the firm's full legal description, CR no. 475059, registration ج.م.ك.1491/2023, represented by المحامي/ علي محمود عبدالنبي العريان, address, phone 95547066, email info@saar.law.
- Prison-visit fee: **500 KWD** per visit.
- Appeal-notice deadline: **5 days**.
- Fonts/sizes: body AL-Mohanad 19pt; headings PT Bold Heading 14pt; title "عقد محاماة" PT Bold Heading 16pt.
- Page: US Letter, 1-inch margins, RTL, footer "صفحة X من Y".

## 5. Example inputs

**A — Accused contracts himself, full payment**
```json
{
  "mode": "self",
  "date": "22 أكتوبر 2026",
  "client": {"title": "السيد", "name": "أحمد علي الكندري", "gender": "m", "nationality": "كويتي",
             "civil_id": "290010100000", "phone": "99999999", "email": "ahmad@example.com",
             "address": "الجابرية، قطعة 1، شارع 5، منزل 10"},
  "case_no": "123/2026 جنح حولي",
  "case_desc": "إساءة استعمال الهاتف",
  "fees": {"mode": "full", "total": 2500},
  "additional_work": null,
  "guarantor": null
}
```

**B — Mother contracts for her son, two installments, additional work**
```json
{
  "mode": "third_party",
  "date": "22 أكتوبر 2026",
  "client": {"title": "السيدة", "name": "فاطمة محمد", "gender": "f", "nationality": "كويتية",
             "civil_id": "280010100000", "phone": "98888888", "email": "f@example.com", "address": "السالمية"},
  "accused": {"title": "السيد", "name": "محمد عبدالله محمد", "gender": "m", "nationality": "كويتي",
              "civil_id": "300010100000", "relation": "ابنها"},
  "case_no": "9/2026 جنايات",
  "case_desc": "حيازة مواد مخدرة بقصد التعاطي",
  "fees": {"mode": "two", "total": 3500, "first": 2000, "second": 1500,
           "second_due": "بعد مرور ستة أشهر ميلادية من تاريخ التوقيع على هذا العقد"},
  "additional_work": "التظلم من أمر الحبس الاحتياطي.",
  "guarantor": null
}
```

**C — Custom payment + joint guarantor**
```json
{
  "mode": "self",
  "date": "22 أكتوبر 2026",
  "client": {"title": "السيد", "name": "...", "gender": "m", "nationality": "كويتي", "civil_id": "...",
             "phone": "...", "email": "...", "address": "..."},
  "case_no": "...", "case_desc": "...",
  "fees": {"mode": "other", "total": 12750, "other_text": "تسدد على ثلاث دفعات شهرية متساوية تبدأ من تاريخ التوقيع."},
  "guarantor": {"title": "السيد", "name": "...", "gender": "m", "nationality": "كويتي", "civil_id": "...",
                "phone": "...", "email": "...", "address": "..."}
}
```

**D — Blank template:** `{}` → produces the full contract with every variable shown as a **yellow-highlighted placeholder** like `[اسم المتعاقد]`. Useful as a "download blank form" button.

## 6. What the parameters change in the output (conditional logic)

| Condition | Effect in the document |
|---|---|
| `mode = self` | Clause "التوكيل والتعاون مع الدفاع"; wording refers to "الطرف الثاني" as the accused |
| `mode = third_party` | Preamble names the accused (name, nationality, civil ID, relation); clause "التزامات الطرف الثاني بصفته متعاقداً لمصلحة المتهم" (6 sub-items) replaces the cooperation clause; extra full-fee case "إذا امتنع المتهم عن إصدار التوكيل…"; liability clause adds "ويسري حكم هذا البند في حق المتهم"; prison/attendance/appeal/notices/notarization clauses use third-party wording |
| `fees.mode = full` | "تسدد كاملة فور التوقيع…"; contract effective after "الأتعاب كاملة" paid |
| `fees.mode = two` | Two bold-labelled installment paragraphs with amounts in digits + words; effective after "الدفعة الأولى" |
| `fees.mode = other` | "تسدد على النحو الآتي: <other_text>" |
| `additional_work` set | Extra sentence in the Scope clause |
| `guarantor` set | Party 3 paragraph, "بينهم" instead of "بينهما", clause "الكفالة التضامنية", 3 signature columns, "ثلاث نسخ أصلية" |
| `gender = f` | Feminine Arabic agreement in that person's paragraph |
| Any value missing/empty | Yellow highlighted `[label]` placeholder — the website should block submission instead, unless producing a blank template |

Clause numbering (البند الأول، الثاني …) and cross-references between clauses (e.g. "وفقاً للبند الحادي عشر") are **computed automatically** — the number of clauses is 21 (22 with a guarantor).

## 7. Output

- One `.docx` file, Arabic RTL, ~8–9 pages.
- Suggested filename: `عقد محاماة - <client.name>.docx` (URL-encode for `Content-Disposition`; use `filename*=UTF-8''…`).
- MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- Contents in order: title → date & parties → preamble (تمهيد) → 21/22 numbered clauses → signature table (no borders) → page-number footer.

## 8. Suggested API (for the developer to implement — framework of his choice)

```
POST /api/contracts/criminal-defense
Content-Type: application/json
Body: <JSON per §4>
→ 200 application/vnd.openxmlformats-officedocument.wordprocessingml.document (file download)
→ 422 {errors:[…]} on validation failure
```

Implementation notes:
1. Validate per §4 (JSON Schema in §9).
2. Write the body to a unique temp file, run `node build_contract.js tmp.json tmp.docx` (`child_process.execFile`, **never** a shell string — names contain Arabic and spaces).
3. Stream the file back and delete temp files.
4. Data is confidential client information (civil IDs, criminal case details): HTTPS only, authenticated access (staff only), don't log request bodies, don't keep generated files after download unless the firm wants an archive.

## 9. JSON Schema (for validation)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CriminalDefenseFeeContract",
  "type": "object",
  "$defs": {
    "person": {
      "type": "object",
      "required": ["title", "name", "gender", "nationality", "civil_id", "phone", "email", "address"],
      "properties": {
        "title": {"type": "string", "minLength": 1},
        "name": {"type": "string", "minLength": 1},
        "gender": {"enum": ["m", "f"]},
        "nationality": {"type": "string", "minLength": 1},
        "civil_id": {"type": "string", "minLength": 1},
        "phone": {"type": "string", "minLength": 1},
        "email": {"type": "string", "minLength": 1},
        "address": {"type": "string", "minLength": 1}
      }
    },
    "money": {"type": "integer", "minimum": 1, "maximum": 999999}
  },
  "required": ["mode", "date", "client", "case_no", "case_desc", "fees"],
  "properties": {
    "mode": {"enum": ["self", "third_party"]},
    "date": {"type": "string", "minLength": 1},
    "client": {"$ref": "#/$defs/person"},
    "accused": {
      "type": "object",
      "required": ["title", "name", "gender", "nationality", "civil_id", "relation"],
      "properties": {
        "title": {"type": "string", "minLength": 1},
        "name": {"type": "string", "minLength": 1},
        "gender": {"enum": ["m", "f"]},
        "nationality": {"type": "string", "minLength": 1},
        "civil_id": {"type": "string", "minLength": 1},
        "relation": {"type": "string", "minLength": 1}
      }
    },
    "case_no": {"type": "string", "minLength": 1},
    "case_desc": {"type": "string", "minLength": 1},
    "fees": {
      "type": "object",
      "required": ["mode", "total"],
      "properties": {
        "mode": {"enum": ["full", "two", "other"]},
        "total": {"$ref": "#/$defs/money"},
        "first": {"$ref": "#/$defs/money"},
        "second": {"$ref": "#/$defs/money"},
        "second_due": {"type": "string", "minLength": 1},
        "other_text": {"type": "string", "minLength": 1}
      },
      "allOf": [
        {"if": {"properties": {"mode": {"const": "two"}}}, "then": {"required": ["first", "second", "second_due"]}},
        {"if": {"properties": {"mode": {"const": "other"}}}, "then": {"required": ["other_text"]}}
      ]
    },
    "additional_work": {"type": ["string", "null"]},
    "guarantor": {"oneOf": [{"type": "null"}, {"$ref": "#/$defs/person"}]}
  },
  "allOf": [
    {"if": {"properties": {"mode": {"const": "third_party"}}}, "then": {"required": ["accused"]}}
  ]
}
```
Plus a server-side check (not expressible above): when `fees.mode = "two"`, `first + second === total`.

## 10. Engine source — `build_contract.js` (copy verbatim, do not modify)

Save the code below as `build_contract.js` next to a `package.json` containing `"dependencies": {"docx": "9.8.1"}`.

```javascript
// مولّد "عقد محاماة" – قضايا الجنايات والجنح
// شركة مكتب علي العريان وحمد الصراف للمحاماة والاستشارات القانونية
// الاستخدام: node build_contract.js config.json output.docx
// أي متغير غير موجود في config يظهر في الملف كخانة صفراء [اسم المتغير] (هكذا يُنتج النموذج الفارغ).
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, BorderStyle, Footer, PageNumber,
} = require("docx");

const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = process.argv[3];

// ===== التنسيق المعتمد =====
const BODY_FONT = "AL-Mohanad", BODY_SIZE = 38;      // 19pt
const HEAD_FONT = "PT Bold Heading", HEAD_SIZE = 28; // 14pt
const TITLE_SIZE = 32;                               // 16pt

// ===== الثوابت =====
const FIRM =
  "شركة مكتب علي العريان وحمد الصراف للمحاماة والاستشارات القانونية شركة مهنية للمحاماة ذ.م.م. – رقم السجل التجاري (475059) رقم القيد في سجل الشركات المهنية لدى جمعية المحامين الكويتية (ج.م.ك.1491/2023) رأس مال الشركة (10000 د.ك) ويمثلها في التوقيع على هذا العقد المحامي/ علي محمود عبدالنبي العريان بصفته مدير الشركة، وعنوانها صباح السالم، قطعة (1)، شارع (102)، برج العربيد، بلوك (4)، الدور (19)، رقم الهاتف هو (95547066) البريد الالكتروني هو info@saar.law ويشار إليها في هذا العقد بالطرف الأول.";

const LABELS = {
  date: "التاريخ", c_title: "اللقب", c_name: "اسم المتعاقد", c_nat: "الجنسية",
  c_cid: "الرقم المدني", c_addr: "العنوان", c_phone: "رقم الهاتف", c_email: "البريد الالكتروني",
  case_no: "رقم القضية", case_desc: "وصف القضية",
  a_title: "اللقب", a_name: "اسم المتهم", a_nat: "جنسية المتهم", a_cid: "الرقم المدني للمتهم", a_rel: "صلة القرابة بالطرف الثاني",
  fee: "مبلغ الأتعاب", fee_words: "المبلغ كتابة",
  payment: "طريقة السداد: كاملة فور التوقيع / على دفعتين وقيمة كل دفعة وموعد الثانية / طريقة أخرى",
  p1: "الدفعة الأولى", p1_words: "كتابة", p2: "الدفعة الثانية", p2_words: "كتابة",
  p2_due: "موعد استحقاق الدفعة الثانية", other: "طريقة السداد",
  g_title: "اللقب", g_name: "اسم الكفيل", g_nat: "الجنسية", g_cid: "الرقم المدني",
  g_addr: "العنوان", g_phone: "رقم الهاتف", g_email: "البريد الالكتروني",
};

// ===== تحويل المبالغ إلى حروف =====
function words(n) {
  n = Math.round(Number(n));
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hund = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  const below1000 = (x) => {
    const parts = [];
    const h = Math.floor(x / 100), r = x % 100;
    if (h) parts.push(hund[h]);
    if (r) {
      if (r < 10) parts.push(ones[r]);
      else if (r < 20) parts.push(teens[r - 10]);
      else parts.push(r % 10 ? ones[r % 10] + " و" + tens[Math.floor(r / 10)] : tens[Math.floor(r / 10)]);
    }
    return parts.join(" و");
  };
  if (n === 0) return "صفر";
  const t = Math.floor(n / 1000), r = n % 1000;
  const parts = [];
  if (t === 1) parts.push("ألف");
  else if (t === 2) parts.push("ألفان");
  else if (t >= 3 && t <= 10) parts.push(below1000(t) + " آلاف");
  else if (t > 10 && t < 100) parts.push(below1000(t) + " ألفاً");
  else if (t >= 100) parts.push(below1000(t) + " ألف");
  if (r) parts.push(below1000(r));
  return parts.join(" و");
}

// ===== المتغيرات =====
const self = cfg.mode !== "third_party";
const c = cfg.client || {}, a = cfg.accused || {}, g = cfg.guarantor || null, f = cfg.fees || {};
const fem = (p) => p && p.gender === "f";
const V = {
  date: cfg.date, case_no: cfg.case_no, case_desc: cfg.case_desc,
  c_title: c.title, c_name: c.name, c_nat: c.nationality, c_cid: c.civil_id, c_addr: c.address,
  c_phone: c.phone, c_email: c.email,
  a_title: a.title, a_name: a.name, a_nat: a.nationality, a_cid: a.civil_id, a_rel: a.relation,
  fee: f.total, fee_words: f.total ? words(f.total) : undefined,
  p1: f.first, p1_words: f.first ? words(f.first) : undefined,
  p2: f.second, p2_words: f.second ? words(f.second) : undefined, p2_due: f.second_due,
  other: f.other_text,
};
if (g) Object.assign(V, {
  g_title: g.title, g_name: g.name, g_nat: g.nationality, g_cid: g.civil_id, g_addr: g.address,
  g_phone: g.phone, g_email: g.email,
});

// ===== أدوات الصياغة =====
// يحوّل نصاً يحتوي {{key}} إلى مقاطع: نص عادي أو متغير (يُملأ أو يظهر خانة صفراء)
function runs(text, o = {}) {
  const out = [];
  const re = /\{\{(\w+)\}\}/g;
  let last = 0, m;
  const mk = (t, extra = {}) => new TextRun({
    text: t, font: { ascii: o.font || BODY_FONT, hAnsi: o.font || BODY_FONT, cs: o.font || BODY_FONT },
    size: o.size || BODY_SIZE, sizeComplexScript: o.size || BODY_SIZE,
    bold: !!o.bold, boldComplexScript: !!o.bold, color: "000000", rightToLeft: true, ...extra,
  });
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(mk(text.slice(last, m.index)));
    const val = V[m[1]];
    if (val === undefined || val === null || val === "") out.push(mk("[" + (LABELS[m[1]] || m[1]) + "]", { highlight: "yellow" }));
    else out.push(mk(String(val)));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(mk(text.slice(last)));
  return out;
}
// فقرة نص: يقبل نصاً أو مصفوفة من [نص, خيارات]
function P(content, o = {}) {
  const children = Array.isArray(content)
    ? content.flatMap(([t, ro]) => runs(t, ro || {}))
    : runs(content, o);
  return new Paragraph({
    bidirectional: true, alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: o.after ?? 120 }, keepNext: !!o.keepNext, children,
  });
}
const H = (t) => new Paragraph({
  bidirectional: true, alignment: AlignmentType.CENTER, keepNext: true, keepLines: true,
  spacing: { before: 200, after: 100 },
  children: runs(t, { font: HEAD_FONT, size: HEAD_SIZE }),
});
const EMPTY = () => new Paragraph({ bidirectional: true, children: [] });

const ORD = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر",
  "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر",
  "التاسع عشر", "العشرون", "الحادي والعشرون", "الثاني والعشرون", "الثالث والعشرون", "الرابع والعشرون", "الخامس والعشرون"];

// ===== صيغ تتغير بحسب الجنس والحالة =====
function partyPara(prefix, p, keys, label) {
  const fm = fem(p);
  return `${prefix}{{${keys.title}}}/ {{${keys.name}}}، {{${keys.nat}}} الجنسية، بطاقة مدنية رقم ({{${keys.cid}}})، ${fm ? "وتقيم" : "ويقيم"} في {{${keys.addr}}}، ورقم ${fm ? "هاتفها" : "هاتفه"} هو ({{${keys.phone}}})، ${fm ? "وبريدها" : "وبريده"} الالكتروني هو ({{${keys.email}}})، ${fm ? "ويشار إليها" : "ويشار إليه"} في هذا العقد ${label}.`;
}
const A = self ? "الطرف الثاني" : "المتهم";        // المتهم
const lA = self ? "للطرف الثاني" : "للمتهم";

// ===== البنود =====
// كل بند: { id, title, body: [فقرات] } – يمكن الإشارة لرقم بند آخر بـ ref(id)
const clauses = [];
const add = (id, title, body) => clauses.push({ id, title, body });
const ref = (id) => () => ORD[clauses.findIndex((x) => x.id === id)];

add("preamble", "اعتبار التمهيد جزءاً من العقد", [
  "يعتبر التمهيد السابق جزءاً لا يتجزأ من أحكام هذا العقد ومكملاً لها، ويعول عليه في تفسير شروط العقد واستكمال نواقصه أينما وجدت.",
]);

{
  const body = [
    `أسند الطرف الثاني إلى الطرف الأول مهمة الدفاع ${self ? "عنه" : "عن المتهم"} في القضية رقم ({{case_no}}) فقط، وذلك أمام جهة التحقيق المختصة ومحكمتي أول درجة والاستئناف، ابتداءً من المرحلة التي تكون عليها القضية في تاريخ التوقيع على هذا العقد.`,
  ];
  if (cfg.additional_work) body.push(`كما يشمل هذا العقد الأعمال الإضافية الآتية: ${cfg.additional_work}`);
  body.push("ولا يُعد تغيير رقم القضية أو قيدها برقم جديد أو إحالتها من جهة إلى أخرى قضيةً جديدة في حكم هذا العقد، ولا يمتد هذا العقد إلى أية قضية أخرى ولو نشأت عن ذات الواقعة أو ارتبطت بها أو ضُمت إليها.");
  add("scope", "نطاق التعاقد", body);
}

add("exclusions", "الأعمال غير المشمولة بالتعاقد", [
  () => `يقتصر التزام الطرف الأول على ما ورد في البند ${ref("scope")()} من هذا العقد، ولا يشمل التعاقد أية أعمال أخرى، وعلى سبيل المثال لا الحصر فإن هذا العقد لا يشمل ما يلي:`,
  "1- مباشرة أية دعوى مدنية متفرعة عن الدعوى الجزائية أو مرتبطة بها أو قائمة على أساسها، سواء أقيمت تبعاً للدعوى الجزائية أو استقلالاً عنها.",
  "2- الطعون غير العادية بكافة أشكالها، بما في ذلك الطعن بالتماس إعادة النظر.",
  "3- الطعون الدستورية بكافة صورها.",
  `4- زيارة المحامي ${lA} في السجن أو في أي مكان يكون محتجزاً فيه، وذلك مع مراعاة ما ورد في البند ${"{{REF_prison}}"} من هذا العقد.`,
  "5- أية أعمال بعد صدور حكم بات في القضية.",
  "6- أية أعمال تتعلق بالتنفيذ الجنائي.",
  "7- تقديم أية طلبات عفو أو إفراج شرطي أو دمج عقوبات.",
  "8- الاستشارات القانونية المكتوبة أو الشفوية.",
  "9- الأعمال التي تتم باللغات الأجنبية، أو خارج إقليم دولة الكويت، أو التي تتعلق بقوانين أجنبية.",
  "وفي جميع الأحوال ينتهي أي التزام على الطرف الأول بصدور حكم بات في القضية، ويخضع أي عمل غير مشمول بهذا العقد لاتفاق مستقل وأتعاب مستقلة.",
]);

add("prison", "أتعاب الزيارة في السجن", [
  self
    ? "في حال طلب الطرف الثاني – بنفسه أو من خلال غيره – قيام المحامي بزيارته في السجن أو في أي مكان يكون محتجزاً فيه، يستحق الطرف الأول أتعاباً إضافية مقدارها (500 د.ك.) (خمسمائة دينار كويتي) عن كل زيارة، يلتزم الطرف الثاني بسدادها قبل إجرائها، على أن يوافق الطرف الأول على تلك الزيارة بما يتناسب مع جدول أعمال المحامين العاملين لديه، ما لم يقرر المحامي بنفسه أن تلك الزيارة ضرورية لتقديم الدفاع في القضية، فلا تستحق عنها أتعاب إضافية."
    : "في حال طلب الطرف الثاني أو المتهم قيام المحامي بزيارة المتهم في السجن أو في أي مكان يكون محتجزاً فيه، يستحق الطرف الأول أتعاباً إضافية مقدارها (500 د.ك.) (خمسمائة دينار كويتي) عن كل زيارة، يلتزم الطرف الثاني بسدادها قبل إجرائها، على أن يوافق الطرف الأول على تلك الزيارة بما يتناسب مع جدول أعمال المحامين العاملين لديه، ما لم يقرر المحامي بنفسه أن تلك الزيارة ضرورية لتقديم الدفاع في القضية، فلا تستحق عنها أتعاب إضافية.",
]);

if (self) {
  add("cooperation", "التوكيل والتعاون مع الدفاع", [
    "يلتزم الطرف الثاني بإصدار توكيل قضايا بأسماء المحامين الذين يحددهم الطرف الأول، وبتقديم كافة الأوراق والمستندات التي من شأنها أن تعين الطرف الأول على إنجاز المهام المنوطة به وفقاً لهذا العقد، وبتقديم أية معلومات يرى الطرف الأول أنها لازمة لتوجيه الدفاع في القضية، كما يلتزم بالامتثال لما يبديه إليه الطرف الأول من نصائح في هذا الصدد، وبتنفيذها بشكل كامل لمصلحة الدفاع.",
  ]);
} else {
  add("thirdparty", "التزامات الطرف الثاني بصفته متعاقداً لمصلحة المتهم", [
    "يقر الطرف الثاني بأنه يتعاقد بموجب هذا العقد باسمه ولمصلحة المتهم، ويلتزم في مواجهة الطرف الأول بما يلي:",
    "1- يكون الطرف الثاني وحده الملتزم أمام الطرف الأول بسداد كامل الأتعاب والرسوم والمصروفات وسائر المبالغ المستحقة بموجب هذا العقد في مواعيدها، ولا يتوقف التزامه بذلك على قبول المتهم أو رضاه أو على نتيجة القضية، ولا يجوز له أن يحتج في مواجهة الطرف الأول بأية علاقة أو تسوية بينه وبين المتهم.",
    "2- يلتزم الطرف الثاني بأن يستصدر من المتهم توكيل قضايا بأسماء المحامين الذين يحددهم الطرف الأول، بما في ذلك اتخاذ الإجراءات اللازمة لإصدار التوكيل من داخل السجن أو مكان الاحتجاز إذا كان المتهم محبوساً.",
    "3- إذا امتنع المتهم عن إصدار التوكيل، أو رفض أن يتولى الطرف الأول الدفاع عنه، أو ألغى التوكيل بعد إصداره، أو وكّل محامياً آخر بدلاً من الطرف الأول، استحق الطرف الأول كامل الأتعاب المتفق عليها في هذا العقد، وأصبحت كافة الدفعات المؤجلة حالّة واجبة السداد فوراً، ولا يحق للطرف الثاني استرداد أي مبلغ مدفوع.",
    "4- يلتزم الطرف الثاني بأن يقدم للطرف الأول ما يتوافر لديه من أوراق ومستندات ومعلومات تتعلق بالقضية، وبأن يعمل على أن يقدم المتهم ما يطلبه الطرف الأول منها.",
    "5- يقر الطرف الثاني بأن الدفاع في القضية حق للمتهم وحده، وأن الطرف الأول يتلقى تعليماته في شأن الدفاع من المتهم، وتُقدَّم تعليمات المتهم عند تعارضها مع تعليمات الطرف الثاني، كما يقر بأن الطرف الأول ملتزم بالمحافظة على أسرار المتهم، وأنه لا يلتزم بإطلاع الطرف الثاني على أية معلومات أو مستندات يطلب المتهم عدم إطلاعه عليها، ولا يُعد ذلك إخلالاً من الطرف الأول بالتزاماته.",
    "6- يضمن الطرف الثاني عدم رجوع المتهم على الطرف الأول بشأن الأتعاب أو المبالغ المسددة بموجب هذا العقد، ويلتزم بتعويض الطرف الأول عن أية مطالبة يوجهها إليه المتهم في هذا الشأن.",
  ]);
}

add("notarization", "تجديد توثيق الوكالة", [
  "يقر الطرف الثاني بأنه اطلع على المادتين (5 مكرراً) و(9 مكرراً) المضافتين إلى القانون رقم (10) لسنة 2020 بشأن التوثيق بموجب المرسوم بقانون رقم (147) لسنة 2025 بتعديل بعض أحكام القانون رقم (10) لسنة 2020 بشأن التوثيق، واللتين نصتا على أن يكون توثيق الوكالة لمدة خمس سنوات ما لم يتفق على مدة أقصر أو تنتهِ الوكالة لأي سبب، ويقر بأنه فهم مضمون ذلك وتبعاته، ووعاه وعياً نافياً للجهالة، " +
  (self
    ? "ويلتزم بإصدار وكالة جديدة للطرف الأول وتوثيقها لدى وزارة العدل قبل انتهاء مدة توثيق الوكالة السارية، "
    : "ويلتزم بأن يتخذ ما يلزم لقيام المتهم بإصدار وكالة جديدة للطرف الأول وتوثيقها لدى وزارة العدل قبل انتهاء مدة توثيق الوكالة السارية، ") +
  "دون حاجة إلى طلب أو إخطار مسبق أو تذكير من الطرف الأول، ويتحمل الطرف الثاني وحده مسئولية الامتناع أو التأخير عن إصدار وكالة جديدة، ويتجدد هذا الالتزام إلى حين انتهاء هذا العقد أو صدور حكم بات في القضية.",
]);

add("expenses", "الرسوم والمصروفات والترجمة", [
  "يلتزم الطرف الثاني بدفع كافة الرسوم والمصروفات القضائية والإدارية وأية نفقات واجبة الأداء لإنجاز المهام المنوطة بالطرف الأول، ويتعين سدادها فور طلبها، وهي مستقلة عن الأتعاب المتفق عليها في هذا العقد، كما يلتزم الطرف الثاني بتقديم ترجمة إلى اللغة العربية لجميع المستندات والأوراق المحررة بلغة أجنبية، والتصديق عليها من الجهات المختصة إذا لزم الأمر، وذلك في المواعيد التي يحددها الطرف الأول، وللطرف الأول ترجمة المستندات التي يحتاجها الدفاع على حساب الطرف الثاني دون حاجة إلى موافقته.",
]);

{
  const body = [];
  const head = () => `يستحق الطرف الأول أتعاباً عن الأعمال المبينة في البند ${ref("scope")()} من هذا العقد إجماليها ({{fee}} د.ك.) ({{fee_words}} دينار كويتي فقط)، `;
  let firstDue;
  if (f.mode === "full") {
    body.push(() => head() + "تسدد كاملة فور التوقيع على هذا العقد وقبل مباشرة الطرف الأول لأي عمل من الأعمال الموكلة إليه بموجبه.");
    firstDue = "الأتعاب كاملة";
  } else if (f.mode === "two") {
    body.push(() => head() + "تسدد على دفعتين على النحو الآتي:");
    body.push([["الدفعة الأولى: ", { bold: true }], ["مبلغ ({{p1}} د.ك.) ({{p1_words}} دينار كويتي) يسدد فور التوقيع على هذا العقد وقبل مباشرة الطرف الأول لأي عمل من الأعمال الموكلة إليه بموجبه."]]);
    body.push([["الدفعة الثانية: ", { bold: true }], ["مبلغ ({{p2}} د.ك.) ({{p2_words}} دينار كويتي) يستحق {{p2_due}}."]]);
    firstDue = "الدفعة الأولى";
  } else if (f.mode === "other") {
    body.push(() => head() + "تسدد على النحو الآتي: {{other}}");
    firstDue = "ما يستحق من الأتعاب عند التوقيع على هذا العقد";
  } else {
    body.push(() => head() + "تسدد على النحو الآتي: {{payment}}");
    firstDue = "ما يستحق من الأتعاب عند التوقيع على هذا العقد";
  }
  body.push(`ولا يكون هذا العقد نافذاً، ولا يلتزم الطرف الأول بمباشرة أي عمل بموجبه، إلا بعد سداد ${firstDue}، وفي حال تخلف الطرف الثاني عن سداد أي مبلغ مستحق بموجب هذا العقد في موعده، يحق للطرف الأول التوقف عن مباشرة تنفيذ هذا العقد دون حاجة إلى إخطار سابق ودون أدنى مسئولية عليه، وتصبح كافة المبالغ المؤجلة حالّة واجبة الأداء فوراً.`);
  body.push("وتعتبر الأتعاب المسددة حقاً مكتسباً للطرف الأول بمجرد سدادها، ولا يحق للطرف الثاني استرداد أي منها تحت أي ظرف من الظروف ولأي سبب كان، وأياً كانت الحالة التي انتهت إليها القضية، وتعتبر كافة المبالغ المؤجلة – إن وجدت – ديناً مستحق الأداء على الطرف الثاني في تاريخ استحقاقها دون حاجة إلى إنذار أو تقاضٍ.");
  add("fees", "الأتعاب وطريقة سدادها", body);
}

{
  const body = [
    "يستحق الطرف الأول كامل الأتعاب المبينة في هذا العقد أياً كانت الحالة التي انتهت إليها القضية، سواء انتهت بالحفظ، أو بالحكم بالبراءة، أو بالامتناع عن النطق بالعقاب، أو بالإدانة، أو بانقضاء الدعوى الجزائية لأي سبب كان، بما في ذلك الصلح أو التنازل من المجني عليه أو الشاكي، سواء تم ذلك بمعرفة الطرف الأول أو بدونها، كما يستحق الطرف الأول كامل الأتعاب في أي من الحالات الآتية:",
    self
      ? "1- إذا طلب الطرف الثاني من الطرف الأول التنحي عن مباشرة الدفاع، أو ألغى التوكيل الصادر له، أو وكّل محامياً آخر بدلاً منه، لأي سبب كان."
      : "1- إذا طلب الطرف الثاني أو المتهم من الطرف الأول التنحي عن مباشرة الدفاع، أو ألغى المتهم التوكيل الصادر له، أو وكّل محامياً آخر بدلاً منه، لأي سبب كان.",
    `2- إذا تخلف ${A} – دون عذر تقبله المحكمة – عن حضور أي من جلسات التحقيق أو المحاكمة التي يتوجب عليه حضورها، أو توارى عن الأنظار، أو غادر البلاد بما يؤدي إلى صدور الحكم في غيبته.`,
    "3- إذا فسخ الطرف الأول هذا العقد بسبب إخلال الطرف الثاني بأي من التزاماته.",
  ];
  if (!self) body.push("4- إذا امتنع المتهم عن إصدار التوكيل اللازم للطرف الأول، أو رفض أن يتولى الطرف الأول الدفاع عنه.");
  body.push("وفي جميع هذه الحالات تصبح كافة الدفعات المؤجلة حالّة واجبة السداد فوراً دون حاجة إلى إنذار أو تقاضٍ.");
  add("fullfees", "استحقاق كامل الأتعاب", body);
}

if (g) {
  add("guarantee", "الكفالة التضامنية", [
    "يُعد الطرف الثالث كفيلاً ضامناً متضامناً مع الطرف الثاني في أداء كافة التزاماته المالية الناشئة عن هذا العقد لصالح الطرف الأول، ويحق للطرف الأول الرجوع عليه منفرداً أو مجتمعاً مع الطرف الثاني بكامل المبالغ المستحقة، دون حاجة إلى الرجوع على الطرف الثاني أولاً أو إنذاره.",
  ]);
}

add("effort", "طبيعة التزام الطرف الأول", [
  "التزام الطرف الأول بموجب هذا العقد التزام ببذل عناية وليس التزاماً بتحقيق نتيجة، ويقر الطرف الثاني بأن الطرف الأول لم يضمن له نتيجة معينة للقضية، وللطرف الأول وحده تقدير خطة الدفاع ووسائله وما يُبدى من دفوع وطلبات بما يراه محققاً لمصلحة الدفاع.",
]);

add("liability", "حدود المسئولية", [
  "لا يجوز للطرف الثاني الرجوع على الطرف الأول بالتعويض عن أية أخطاء مهنية قد تقع منه، فيما عدا ما ينشأ عن الغش أو الخطأ الجسيم، وفي جميع الأحوال لا يجوز أن يزيد مقدار التعويض المستحق على الطرف الأول – أياً كان سببه – عن إجمالي الأتعاب المدفوعة فعلياً بموجب هذا العقد، بغض النظر عن قيمة التعويض الجابر للأضرار التي قد تترتب." +
  (self ? "" : " ويسري حكم هذا البند في حق المتهم."),
]);

add("data", "صحة البيانات والمستندات", [
  "يقر الطرف الثاني بأنه مسئول عن صحة كافة البيانات والمعلومات والمستندات التي يزود بها الطرف الأول أياً كانت وسيلة إبلاغه بها، ويتحمل وحده مسئولية صحتها عند تقديمها من الطرف الأول إلى جهات التحقيق والمحاكم وسائر الجهات الرسمية، وهذه قرينة اتفق عليها الأطراف لا تقبل إثبات العكس.",
]);

add("attendance", "حضور الجلسات", [
  self
    ? "يقر الطرف الثاني بالعلم بأن القانون الكويتي يوجب على المتهم حضور جلسات المحاكمة بشخصه أمام كافة درجات التقاضي متى كانت التهمة المسندة إليه جناية، وفي غير ذلك من الأحوال التي يوجب فيها القانون حضوره أو تأمر فيها المحكمة بحضوره شخصياً، فضلاً عن جلسات التحقيق التي يُطلب حضوره فيها، وأنه في حال تخلفه عن الحضور قد يتعذر على الطرف الأول تقديم الدفاع، ويتحمل الطرف الثاني وحده مسئولية الالتزام بالحضور ومتابعة مواعيد الجلسات حال كان حضوره وجوبياً، دون أدنى مسئولية على الطرف الأول."
    : "يقر الطرف الثاني بالعلم بأن القانون الكويتي يوجب على المتهم حضور جلسات المحاكمة بشخصه أمام كافة درجات التقاضي متى كانت التهمة المسندة إليه جناية، وفي غير ذلك من الأحوال التي يوجب فيها القانون حضوره أو تأمر فيها المحكمة بحضوره شخصياً، فضلاً عن جلسات التحقيق التي يُطلب حضوره فيها، وأنه في حال تخلف المتهم عن الحضور قد يتعذر على الطرف الأول تقديم الدفاع، ويلتزم الطرف الثاني بمتابعة مواعيد الجلسات والعمل على حضور المتهم متى كان حضوره وجوبياً، دون أدنى مسئولية على الطرف الأول.",
]);

add("appeal", "الطعن في الأحكام", [
  self
    ? "في حال صدور حكم أو قرار في غير صالح الطرف الثاني، يلتزم الطرف الثاني بإخطار الطرف الأول برغبته في الطعن عليه، وبسداد الكفالة والرسوم اللازمة للطعن، وذلك خلال مدة لا تجاوز (5) خمسة أيام من تاريخ صدوره، فإذا لم يقم بذلك تنتفي مسئولية الطرف الأول عن فوات مواعيد الطعن."
    : "في حال صدور حكم أو قرار في غير صالح المتهم، يلتزم الطرف الثاني بإخطار الطرف الأول برغبة المتهم في الطعن عليه، وبسداد الكفالة والرسوم اللازمة للطعن، وذلك خلال مدة لا تجاوز (5) خمسة أيام من تاريخ صدوره، فإذا لم يتم ذلك تنتفي مسئولية الطرف الأول عن فوات مواعيد الطعن.",
]);

add("notices", "الإعلانات القضائية", [
  self
    ? "يلتزم الطرف الثاني بالاشتراك في تطبيق (سهل) وتطبيق (هويتي) وخدمة الرسائل النصية لوزارة العدل، وبذل كافة الجهود اللازمة لتلقي الإعلانات والإخطارات الصادرة من جهات التحقيق والمحاكم، كما يلتزم بإبلاغ الطرف الأول بأي إعلان أو إخطار أو ميعاد جلسة فور علمه به بأي طريقة كانت وقبل وقت كافٍ من الميعاد المحدد، ويكون وحده مسئولاً عن أي أثر يترتب على التأخير في ذلك."
    : "يلتزم الطرف الثاني بأن يعمل على اشتراك المتهم في تطبيق (سهل) وتطبيق (هويتي) وخدمة الرسائل النصية لوزارة العدل، وبمتابعة ما يصدر في القضية من إعلانات وإخطارات من جهات التحقيق والمحاكم، كما يلتزم بإبلاغ الطرف الأول بأي إعلان أو إخطار أو ميعاد جلسة فور علمه أو علم المتهم به بأي طريقة كانت وقبل وقت كافٍ من الميعاد المحدد، ويكون وحده مسئولاً عن أي أثر يترتب على التأخير في ذلك.",
]);

add("correspondence", "المراسلات والإخطارات بين الطرفين", [
  "يقر الطرف الثاني بأن عنوانه ورقم هاتفه وبريده الالكتروني المدونة في صدر هذا العقد هي أساس التخاطب والتراسل بين الطرفين، ويلتزم بإخطار الطرف الأول بأي تغيير يطرأ عليها، ويتحمل كافة الآثار المترتبة على مخالفة ذلك، وتصح إخطارات الطرف الأول للطرف الثاني بأية وسيلة يثبت بها العلم، بما في ذلك الرسائل النصية ورسائل تطبيق (واتساب) على رقم هاتفه المبين في صدر هذا العقد، والبريد الالكتروني، بينما تقتصر الوسيلة المعتد بها قانوناً لمخاطبات الطرف الثاني إلى الطرف الأول على البريد الالكتروني للطرف الأول المبين في صدر هذا العقد، ولا يعتد بأية وسيلة أخرى.",
]);

add("lawyers", "مباشرة الأعمال من خلال المحامين", [
  "يباشر الطرف الأول التزاماته المقررة في هذا العقد من خلال أي من الشركاء أو المحامين العاملين لديه، وله أن يوكل في ذلك محامياً آخر متى رأى ذلك لازماً لحسن سير الدفاع، ويقر الطرف الثاني بعلمه بطبيعة الخبرة القانونية للمحامين القائمين على تنفيذ هذا العقد ودرجات قيدهم في جدول المحامين.",
]);

add("confidentiality", "السرية", [
  "يلتزم الطرف الأول بالمحافظة على سرية المعلومات والمستندات التي يطلع عليها بمناسبة تنفيذ هذا العقد، ولا يُعد إفشاءً للسرية ما يقدمه الطرف الأول إلى جهات التحقيق أو المحاكم أو غيرها من الجهات الرسمية مما يقتضيه الدفاع، أو ما يلزمه القانون بالإفصاح عنه.",
]);

add("termination", "فسخ العقد", [
  () => `في حال إخلال الطرف الثاني بأي من التزاماته الواردة في هذا العقد، يحق للطرف الأول فسخ العقد بعد إنذار الطرف الثاني كتابةً أو من خلال البريد الالكتروني أو الرسائل الهاتفية بذلك الإخلال، وله الامتناع عن مباشرة الأعمال الموكولة إليه، دون أدنى مسئولية عليه في ذلك، مع احتفاظه بحقه في كامل الأتعاب وفقاً للبند ${ref("fullfees")()} من هذا العقد.`,
]);

add("law", "القانون الواجب التطبيق والاختصاص", [
  "يخضع هذا العقد لأحكام القانون الكويتي، وتختص المحاكم الكويتية بنظر أي نزاع ينشأ عن تنفيذ أو تفسير أي بند من بنوده.",
]);

add("copies", "نسخ العقد", [
  g ? "حرر هذا العقد من ثلاث نسخ أصلية بيد كل طرف نسخة منه للعمل بموجبها." : "حرر هذا العقد من نسختين أصليتين بيد كل طرف نسخة منه للعمل بموجبها.",
]);

// ===== تجميع المستند =====
const children = [EMPTY(), EMPTY()];
children.push(new Paragraph({
  bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: runs("عقد محاماة", { font: HEAD_FONT, size: TITLE_SIZE }),
}));
children.push(P(`إنه في دولة الكويت في {{date}} تم الاتفاق بين كل من:`));
children.push(P("1- " + FIRM));
children.push(P(partyPara("2- ", c, { title: "c_title", name: "c_name", nat: "c_nat", cid: "c_cid", addr: "c_addr", phone: "c_phone", email: "c_email" }, "بالطرف الثاني")));
if (g) children.push(P(partyPara("3- ", g, { title: "g_title", name: "g_name", nat: "g_nat", cid: "g_cid", addr: "g_addr", phone: "g_phone", email: "g_email" }, "بالطرف الثالث")));
children.push(P(g
  ? "وبعد أن أقر كل طرف بصفته وأهليته القانونية للتعاقد والتصرف وبخلو إرادته من العيوب المبطلة للتعاقد شرعاً وقانوناً، فقد تم الاتفاق بينهم على الآتي:"
  : "وبعد أن أقر كل طرف منهما بصفته وأهليته القانونية للتعاقد والتصرف وبخلو إرادتيهما من العيوب المبطلة للتعاقد شرعاً وقانوناً، فقد تم الاتفاق بينهما على الآتي:"));

children.push(H("تمهيد"));
const FIRM_INTRO = "حيث إن الطرف الأول شركة محاماة مهنية مقيدة في سجل الشركات المهنية لدى جمعية المحامين الكويتية، ولديها طاقم من المحامين ذوي الخبرة والمعرفة بقوانين دولة الكويت، ";
if (self) {
  children.push(P(FIRM_INTRO + "وحيث إن الطرف الثاني يحتاج إلى خدمات الطرف الأول ليتولى الدفاع عنه في القضية رقم ({{case_no}})، والمتعلقة بـ({{case_desc}})، ويشار إليها في هذا العقد بـ(القضية)، لذا فقد تلاقت إرادة الطرفين على ما يلي:"));
} else {
  const af = fem(a);
  children.push(P(FIRM_INTRO + `وحيث إن الطرف الثاني يرغب في التعاقد مع الطرف الأول باسمه ولمصلحة {{a_title}}/ {{a_name}}، {{a_nat}} الجنسية، بطاقة مدنية رقم ({{a_cid}})، ${af ? "وصلتها" : "وصلته"} بالطرف الثاني: ({{a_rel}})، ${af ? "ويشار إليها" : "ويشار إليه"} في هذا العقد بـ(المتهم)، ليتولى الطرف الأول الدفاع عن المتهم في القضية رقم ({{case_no}})، والمتعلقة بـ({{case_desc}})، ويشار إليها في هذا العقد بـ(القضية)، لذا فقد تلاقت إرادة الطرفين على ما يلي:`));
}

const refPrison = ORD[clauses.findIndex((x) => x.id === "prison")];
clauses.forEach((cl, i) => {
  children.push(H(`البند ${ORD[i]} (${cl.title})`));
  cl.body.forEach((b) => {
    if (typeof b === "function") b = b();
    if (typeof b === "string") b = b.replace("{{REF_prison}}", refPrison);
    children.push(Array.isArray(b) ? P(b) : P(b));
  });
});

// ===== التوقيعات =====
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const cols = [["الطرف الأول:"], [g ? "الطرف الثاني:" : "الطرف الثاني:"]];
if (g) cols.push(["الطرف الثالث:"]);
const TABLE_W = 9360, colW = Math.floor(TABLE_W / cols.length);
const sigCell = (title) => new TableCell({
  width: { size: colW, type: WidthType.DXA }, borders: { top: NB, bottom: NB, left: NB, right: NB },
  children: [
    P([[title, { bold: true }]], { align: AlignmentType.RIGHT }),
    P("الاسم: " + ".".repeat(cols.length > 2 ? 14 : 26), { align: AlignmentType.RIGHT }),
    P("التوقيع: " + ".".repeat(cols.length > 2 ? 12 : 24), { align: AlignmentType.RIGHT }),
  ],
});
children.push(EMPTY());
children.push(new Table({
  width: { size: TABLE_W, type: WidthType.DXA }, columnWidths: cols.map(() => colW),
  visuallyRightToLeft: true, borders: noBorders,
  rows: [new TableRow({ cantSplit: true, children: cols.map((x) => sigCell(x[0])) })],
}));


const footer = new Footer({
  children: [new Paragraph({
    bidirectional: true, alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "صفحة ", font: { cs: BODY_FONT, ascii: BODY_FONT, hAnsi: BODY_FONT }, size: 24, sizeComplexScript: 24, rightToLeft: true }),
      new TextRun({ children: [PageNumber.CURRENT], size: 24, sizeComplexScript: 24 }),
      new TextRun({ text: " من ", font: { cs: BODY_FONT, ascii: BODY_FONT, hAnsi: BODY_FONT }, size: 24, sizeComplexScript: 24, rightToLeft: true }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 24, sizeComplexScript: 24 }),
    ],
  })],
});

const doc = new Document({
  styles: { default: { document: { run: { font: { ascii: BODY_FONT, hAnsi: BODY_FONT, cs: BODY_FONT }, size: BODY_SIZE, sizeComplexScript: BODY_SIZE, rightToLeft: true } } } },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    footers: { default: footer },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log("written", OUT); });
```

## 11. Test checklist (verified 22 Oct 2026)

| Test input | Result |
|---|---|
| Example A (self, full) | 21 clauses, 0 placeholders, "ألفان وخمسمائة" ✔ |
| Example B (third_party, two installments, additional work) | 21 clauses, 0 placeholders ✔ |
| Example C (other payment + guarantor) | 22 clauses, 3 signature columns, "اثنا عشر ألفاً وسبعمائة وخمسون" ✔ |
| Example D (`{}`) | Full blank template with 14 yellow placeholders ✔ |
| Opens in Word / converts to PDF via LibreOffice | ✔ |

# CekPKWT Brand Guidelines v1.0

> Last updated: 2026-10-28
> Status: Draft
> Theme: **Tinta & Stabilo** (ink and highlighter)

## Quick Reference

| Element | Value |
|---------|-------|
| Primary Color | #1F2A55 |
| Secondary Color | #2F54C8 |
| Accent Color | #FFD84D |
| Primary Font | Plus Jakarta Sans |
| Tagline | Cek dulu, baru tanda tangan. |
| Voice | Teliti, Jujur, Berpihak, Tenang |

---

## Brand Concept

**Name.** *Cek* (check) + *PKWT* (Perjanjian Kerja Waktu Tertentu, fixed-term contract). It says what the product does. Always written `CekPKWT`: one word, capital C, all-caps PKWT.

**Big idea: "Cek dulu, baru tanda tangan."** (Check first, then sign.) The product works in the short window before a fresh graduate signs. The brand should feel like a calm, well-read *kakak tingkat* (older schoolmate) who reads the contract with you, marks the lines that need attention, and tells you where each rule comes from.

**Visual metaphor: ink and highlighter.**

- **Tinta** (ink): the contract itself, formal, serious, and permanent once signed.
- **Stabilo** (highlighter; Indonesians call any highlighter a *stabilo*): the act of checking. It marks the clauses worth a second look.
- **The signature line**: the logo puts a check mark *above* the line you sign on. Checking comes before signing.

**Archetype:** Sage with a Caregiver's warmth. It knows the rules and cites them, and it stays on the worker's side without being hostile toward employers.

---

## 1. Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Tinta | #1F2A55 | rgb(31,42,85) | Logo, headings, primary buttons, quote rules |
| Tinta Dark | #171F42 | rgb(23,31,66) | Body text, hover on primary |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Biru Pasal | #2F54C8 | rgb(47,84,200) | Links, citation chips, focus ring, low-severity findings |
| Biru Pasal Light | #E8EEFC | rgb(232,238,252) | Citation and low-severity backgrounds |

### Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Stabilo | #FFD84D | rgb(255,216,77) | Logo check, highlight CTA, dark-mode primary |
| Stabilo Light | #FFEA8A | rgb(255,234,138) | Highlighting quoted contract text |

### Neutral Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Kertas (Paper) | #FAF8F3 | rgb(250,248,243) | Page background |
| Surface | #FFFFFF | rgb(255,255,255) | Cards, report panels |
| Kertas Sunken | #F3F0E8 | rgb(243,240,232) | Code blocks, input wells |
| Text Primary | #171F42 | rgb(23,31,66) | Headings, body text |
| Text Secondary | #5B6178 | rgb(91,97,120) | Captions, metadata, timestamps |
| Border | #E7E3D8 | rgb(231,227,216) | Dividers, card borders |

### Semantic Colors

The product's main output is a severity-rated finding. Each severity level has a text color and a background color, and must always appear with an icon and a written label (see §7).

| State | Text | Background | Usage |
|-------|------|------------|-------|
| Keparahan tinggi (high) | #B42318 | #FEE4E2 | High-severity finding, error |
| Keparahan sedang (medium) | #B54708 | #FEF0C7 | Medium-severity finding, warning |
| Keparahan rendah (low) | #2F54C8 | #E8EEFC | Low-severity finding, info |
| Tanpa masalah (no issue) | #067647 | #DCFAE6 | Clauses with no issue found, success |
| Tidak dapat diperiksa (unchecked) | #475467 | #F2F4F7 | Clauses the system could not check |

### Dark Mode

| Role | Hex | Note |
|------|-----|------|
| Background | #0F1530 | Deepest Tinta |
| Surface | #171F42 | |
| Text | #EEF0F7 | |
| Text muted | #A8B0CC | 8.3:1 on background |
| Primary (buttons) | #FFD84D | Stabilo takes over as primary, with Tinta text |
| Links / citations | #9AB1EF | |

Use the **reversed logo** (Stabilo tile) on dark backgrounds. The Tinta tile disappears on dark navy.

### Accessibility

Measured contrast ratios (WCAG 2.1):

| Pair | Ratio | Level |
|------|-------|-------|
| Tinta #1F2A55 on white | 13.8:1 | AAA |
| Tinta on Stabilo #FFD84D | 10.0:1 | AAA |
| Text Secondary #5B6178 on Kertas | 5.8:1 | AA |
| Biru Pasal #2F54C8 on white | 6.5:1 | AA |
| Each severity text on its background | 4.8–7.0:1 | AA |

**Hard rules**

- **Never** set Stabilo text on white or Kertas (1.4:1). Stabilo is a fill color, not a text color.
- Never show severity by color alone. Always pair it with an icon and the word (*Tinggi*, *Sedang*, *Rendah*).
- The focus ring is Biru Pasal (2px, 2px offset), never Stabilo, because Stabilo fails 3:1 on light surfaces.

### Color Proportions

About 60% Kertas/white, 30% Tinta, 7% Biru Pasal, 3% Stabilo. Stabilo works because it is rare. If everything is highlighted, nothing stands out.

---

## 2. Typography

### Font Stack

```css
--font-heading: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-body: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-quote: 'Source Serif 4', Georgia, 'Times New Roman', serif;
--font-mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;
```

### Why These Fonts

Each family has a single job, so readers can tell who is speaking:

| Family | Role | Rationale |
|--------|------|-----------|
| **Plus Jakarta Sans** | CekPKWT's own voice: UI, headings, explanations | Designed by Tokotype, an Indonesian foundry, originally for Jakarta's city identity. It is local, modern, and friendly, and the MVP starts in DKI Jakarta. |
| **Source Serif 4** | Quoted text from the **contract** or a **regulation** | A serif signals "this is the document, not the AI." Quoted contract lines are set in serif with a Stabilo highlight. |
| **JetBrains Mono** | Article IDs, corpus IDs, tool names (`pp35-12`, `check_work_contract`) | For precise references people may copy. |

### Type Scale

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|----------------|---------------|--------|-------------|
| H1 | 44px | 32px | 800 | 1.15 |
| H2 | 32px | 26px | 700 | 1.2 |
| H3 | 24px | 20px | 700 | 1.3 |
| H4 | 18px | 18px | 700 | 1.4 |
| Body | 16px | 16px | 400 | 1.6 |
| Body Large | 18px | 18px | 400 | 1.6 |
| Quote (serif) | 17px | 16px | 400 | 1.65 |
| Small / Meta | 14px | 14px | 500 | 1.5 |
| Caption / Badge | 12px | 12px | 600 | 1.4 |

Indonesian legal phrases are long ("dimaknai putusan Mahkamah Konstitusi"). Keep body text at 16px or larger and limit line length to about 70 characters.

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 3. Logo Usage

### Concept

A Tinta tile containing a **Stabilo check mark above a signature line**: *cek dulu, baru tanda tangan.* The wordmark sets **Cek** in Plus Jakarta Sans Medium (500) and **PKWT** in ExtraBold (800). The action is light and the subject is heavy. Letterforms are outlined to paths, so the logo renders the same without the font installed.

### Variants

| Variant | File | Use Case |
|---------|------|----------|
| Full Horizontal | `assets/logos/cekpkwt-logo-full-horizontal.svg` | README header, slides, documents on light backgrounds |
| Full Horizontal Reversed | `assets/logos/cekpkwt-logo-full-horizontal-reversed.svg` | Dark backgrounds (#0F1530 and similar) |
| Icon Only | `assets/logos/cekpkwt-logo-icon.svg` | Favicon, avatar, MCP server icon, small spaces |
| Icon Reversed | `assets/logos/cekpkwt-logo-icon-reversed.svg` | Icon on dark backgrounds |
| Monochrome | `assets/logos/cekpkwt-logo-mono.svg` | Single-color print, stamps, watermarks (uses `currentColor`) |

### Clear Space

Keep clear space on every side equal to **¼ of the tile height**, which is the height of the check mark's short stroke.

### Minimum Size

| Context | Minimum Width |
|---------|---------------|
| Digital - Full Logo | 120px |
| Digital - Icon | 16px |
| Print - Full Logo | 35mm |
| Print - Icon | 8mm |

### Don'ts

- Don't recolor the check. It is always Stabilo on Tinta, or Tinta on Stabilo when reversed.
- Don't use the Tinta tile on dark backgrounds. Use the reversed variant.
- Don't separate "Cek" and "PKWT", or set them in the same weight.
- Don't add a gavel, scales of justice, or a shield. CekPKWT is not a court and not a lawyer.
- Don't rotate, skew, outline, add shadows, or change proportions.

---

## 4. Voice & Tone

### Brand Personality

| Trait | Description |
|-------|-------------|
| **Teliti (Meticulous)** | Reads every clause, cites the exact article and its status, shows its sources. |
| **Jujur (Honest)** | Says plainly when it cannot check something or does not know. Never overclaims. |
| **Berpihak (On your side)** | Protects the worker's interests, without treating employers as enemies. |
| **Tenang (Calm)** | Reduces anxiety instead of creating it. Gives a clear next step, not alarm. |

### Voice Chart

| Trait | We Are | We Are Not |
|-------|--------|------------|
| Teliti | Precise, sourced, specific | Pedantic, full of legal jargon |
| Jujur | Clear about limits, says "tidak ditemukan" | Hedging every sentence, or overpromising |
| Berpihak | Empowering, practical | Accusatory, anti-employer, preachy |
| Tenang | Measured, reassuring | Alarmist, scary, dramatic |

### Form of Address

| Context | Pronoun | Why |
|---------|---------|-----|
| Product chat, reports, social, landing page | **kamu** | Speaks to a fresh grad like a peer or older schoolmate |
| Email draft to HR, formal documents, README setup | **Anda** / **saya** | Professional register for the employer relationship |

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Report summary | Neutral, factual | "Ditemukan 2 potensi masalah (1 tinggi, 1 rendah). Rezim aturan: current." |
| High-severity finding | Calm, specific, actionable | "Klausul ini mungkin bertentangan dengan PP 35/2021 Pasal 12. Sebaiknya dikonfirmasi ke HR sebelum tanda tangan." |
| Correcting a wrong claim | Direct in the first sentence | "Tidak. PKWT tidak dapat mensyaratkan masa percobaan (PP 35/2021, Pasal 12, berlaku)." |
| Not found / unknown | Honest, then redirect | "Saya tidak menemukan jawabannya di sumber regulasi yang saya miliki. Coba tanyakan ke Disnaker atau LBH setempat." |
| Out of scope | Kind, clear boundary | "CekPKWT saat ini hanya memeriksa kontrak PKWT. Kontrak magang belum bisa saya periksa." |
| HR email draft | Formal, polite, curious | "Saya ingin memastikan pemahaman saya mengenai ketentuan masa percobaan pada draf kontrak ini." |
| Marketing / social | Warm, peer-to-peer | "Kontrak kerja pertama? Cek dulu, baru tanda tangan." |

### Vocabulary

| Say | Instead of |
|-----|------------|
| potensi masalah | pelanggaran |
| mungkin bertentangan dengan | melanggar / ilegal |
| perlu dikonfirmasi | salah / curang |
| pasal rujukan | dasar hukum yang pasti |
| tidak dapat diperiksa | (silence or guessing) |
| pertanyaan untuk HR | tuntutan / protes |

### Prohibited Terms

| Avoid | Reason |
|-------|--------|
| ilegal | CekPKWT is not a court; use "mungkin bertentangan dengan" |
| melanggar hukum | Same as above; findings are potential issues, not rulings |
| pasti / dijamin / 100% aman | AI can be wrong; the corpus is limited |
| nasihat hukum (as a claim) | CekPKWT is explicitly *not* legal advice |
| pengacara AI | Misrepresents the product; implies legal representation |
| perusahaan curang / menipu | Describe the clause, never the employer's intent |
| revolusioner / canggih | Empty claims; say what it does instead |

### Required Copy

Every report and answer ends with this disclaimer:

> *Ini bukan nasihat hukum. Hasil CekPKWT dibuat oleh AI dari basis regulasi yang terbatas dan bisa keliru. Untuk masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.*

Citation format (always copied exactly from the corpus header): `(Regulasi, Pasal, status)`, e.g. `(PP 35/2021, Pasal 12, berlaku)`.

---

## 5. Messaging

### Positioning Statement

For **fresh graduates in Indonesia** about to sign their first PKWT contract, **CekPKWT** is an AI contract checker that **flags clauses that may conflict with labor rules before you sign**. Unlike asking friends or a general chatbot, every finding cites the **exact article and its current legal status**, and it says honestly what it cannot check.

### Taglines

| Use | Line |
|-----|------|
| Primary | **Cek dulu, baru tanda tangan.** |
| Supporting | Paham hakmu sebelum tanda tangan. |
| Supporting | Kontrak pertamamu, dibaca dengan teliti. |
| English (judges, international) | Check before you sign. |

### Elevator Pitch

**Bahasa Indonesia:**
> CekPKWT membantu fresh graduate memeriksa kontrak PKWT sebelum tanda tangan. Tempel teks kontraknya, dan CekPKWT menandai klausul yang mungkin bertentangan dengan aturan, lengkap dengan pasal rujukan, status berlakunya, dan pertanyaan sopan yang bisa kamu ajukan ke HR.

**English:**
> CekPKWT is an AI agent that checks Indonesian fixed-term (PKWT) employment contracts before fresh graduates sign them. Every finding cites the exact article and its legal status, rates its severity, and turns into a polite question for HR, drafted but never sent without you.

### Message Pillars

| Pillar | Message | Proof Point |
|--------|---------|-------------|
| **Berbasis pasal** (Source-grounded) | Every finding points to a real article. | 64-entry curated corpus; each entry has `source_url`, `retrieved_on`, and a `verification` level |
| **Jujur soal batas** (Honest about limits) | If it can't check it, it says so. | Dedicated "Tidak dapat diperiksa" section; fixed "tidak ditemukan" response |
| **Privasi dulu** (Privacy first) | Your personal data never reaches the model. | NIK, NPWP, phone, account number, name, address, and date of birth are redacted before processing; contracts are never stored in the vector DB |
| **Kendali di tanganmu** (You stay in control) | It drafts, you decide. | Gmail send actions are disabled at the component level; drafts only |
| **Siap untuk aturan baru** (Ready for new rules) | Built for the coming labor law change. | Every article is tagged with `status` and `regime`; a new law means new rows, not a rebuild |

### Audience Messages

| Audience | What they care about | Lead with |
|----------|----------------------|-----------|
| Fresh graduates | "Am I about to sign something unfair?" Fear of losing the offer | "Cek dulu, baru tanda tangan. Tanya HR dengan sopan, tanpa canggung." |
| Campus career centers | Scalable support for many graduates | "Pendampingan cek kontrak untuk setiap lulusan, dengan sumber yang bisa diverifikasi." |
| Hackathon judges | Real problem, responsible AI, clean architecture | "Source-grounded, privacy-first, and human-in-the-loop by design, not by prompt." |

### Boilerplate

> **CekPKWT** adalah AI agent yang membantu fresh graduate memeriksa kontrak kerja waktu tertentu (PKWT) sebelum menandatanganinya. Dibangun dengan IBM Bob dan IBM Langflow, CekPKWT hanya menjawab dari basis regulasi resmi yang terverifikasi, mencantumkan pasal rujukan beserta status berlakunya, dan mengubah temuan menjadi pertanyaan untuk HR. Tema: Education & Future of Work.

---

## 6. Imagery Guidelines

### Photography Style

- **Subjects:** Young Indonesian professionals (22–26), real settings such as a kos, a campus library, or a coworking desk. Diverse, not staged.
- **Moments:** Reading a document, holding a highlighter, thinking before signing. Focused and calm, not stressed.
- **Lighting:** Natural, soft daylight.
- **Color treatment:** Warm paper whites, with Tinta navy present in clothing or objects where possible.

### Illustrations

- Style: Flat editorial, built from simple geometric shapes
- Colors: Tinta, Kertas, one Stabilo highlight per illustration, with Biru Pasal sparingly
- Motifs: Paper sheets, highlighted lines, signature lines, check marks, speech bubbles
- Line weight: 2px, round caps and joins (matching the logo's check)
- Corners: rounded, 6–16px

### Icons

- Library: **Lucide** (open source, consistent with the round caps in the logo)
- Grid: 24px; stroke 1.75px; round caps; outline only
- Severity icons: `octagon-alert` (Tinggi), `triangle-alert` (Sedang), `info` (Rendah), `circle-check` (Tanpa masalah), `circle-dashed` (Tidak dapat diperiksa)

### Visual Don'ts

| Avoid | Reason |
|-------|--------|
| Gavels, scales of justice, courtrooms | Suggests legal advice or litigation; intimidating |
| Handshake stock photos | Generic corporate cliché |
| Red stamps saying "DITOLAK" / "ILEGAL" | Accusatory; contradicts the non-judgmental voice |
| Robots, glowing brains, circuitry | AI cliché; the product's value is the sources, not "AI magic" |
| Anxious or crying people | Fear-based; the brand is calm |

---

## 7. Design Components

### Finding Card (the core UI unit)

```
┌───────────────────────────────────────────────────────┐
│ 1  Masa percobaan pada PKWT        [▲ Keparahan: Tinggi]│  ← H4 + severity badge
│                                                         │
│ ┃ "Karyawan menjalani masa percobaan selama 3 bulan."   │  ← serif quote, Stabilo
│                                                         │     highlight, Tinta left rule
│ Potensi masalah: PKWT tidak dapat mensyaratkan ...      │  ← body (sans)
│                                                         │
│ [PP 35/2021 · Pasal 12 · berlaku]   Keyakinan: tinggi   │  ← citation chip (mono)
│                                                         │
│ Pertanyaan untuk HR                          [Salin]    │  ← sunken box + copy action
│ Apakah ketentuan masa percobaan ini dapat ditinjau ...  │
└───────────────────────────────────────────────────────┘
```

### Severity Badge

Pill (`radius: 9999px`), 12px/600 text, 16px icon, 4px 10px padding. The label always uses the full word: **Tinggi**, **Sedang**, **Rendah**, **Tanpa masalah**, **Tidak dapat diperiksa**. "Tidak dapat diperiksa" uses a **dashed** 1px border to show that this is a gap in coverage, not a verdict.

### Citation Chip

Mono font, 13px, Biru Pasal text #1C3586 on #F3F6FE, 1px border #C9D6F7, radius 6px. Format: `Regulasi · Pasal · status`. Add a small status dot: green `berlaku`, orange `diubah`, blue `dimaknai_putusan_mk`, gray `catatan_sistem`.

### Contract Quote

Source Serif 4, 17px, Tinta left rule 3px, Stabilo Light (#FFEA8A) highlight behind the quoted text, never behind the whole block.

### Buttons

| Type | Background | Text | Border Radius |
|------|------------|------|---------------|
| Primary | #1F2A55 | #FFFFFF | 10px |
| Highlight (one per screen, hero CTA) | #FFD84D | #1F2A55 | 10px |
| Secondary | Transparent, 1.5px #1F2A55 border | #1F2A55 | 10px |
| Tertiary | Transparent | #2F54C8 | 10px |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gaps |
| sm | 8px | Compact elements, badge padding |
| md | 16px | Standard spacing, card inner gaps |
| lg | 24px | Card padding |
| xl | 32px | Between findings |
| 2xl | 48px | Section dividers |

### Border Radius

| Element | Radius |
|---------|--------|
| Citation chips | 6px |
| Buttons, inputs | 10px |
| Cards, report panels | 16px |
| Badges, tags | 9999px |

Tokens: `assets/design-tokens.json` → `assets/design-tokens.css` (dark mode under `.dark`).

---

## AI Image Generation

### Base Prompt Template

Always prepend to image generation prompts:

```
Flat editorial illustration, calm and reassuring mood, deep ink navy (#1F2A55) and warm paper off-white (#FAF8F3) as dominant colors, a single highlighter-yellow (#FFD84D) accent marking one line of a document, occasional muted blue (#2F54C8), clean geometric shapes, rounded line ends, generous negative space, soft natural light, Indonesian young-professional context, no text, no logos
```

### Style Keywords

| Category | Keywords |
|----------|----------|
| **Lighting** | soft daylight, diffuse, warm paper tones |
| **Mood** | calm, focused, reassuring, empowering |
| **Composition** | centered subject, ample whitespace, document as hero object |
| **Treatment** | flat, low-texture, limited palette, high legibility |
| **Aesthetic** | editorial, modern Indonesian, minimal, warm-professional |

### Visual Mood Descriptors

- A quiet moment of reading before signing
- A highlighter making one line stand out on a clean page
- Confidence from understanding, not fear of being cheated

### Visual Don'ts

| Avoid | Reason |
|-------|--------|
| Gavels, scales, courtrooms, judges | Implies legal advice or litigation |
| Robots, neon circuits, glowing AI brains | AI cliché; distracts from the sources |
| Stressed, crying, or panicking people | Contradicts the calm brand |
| Readable fake contract text | Can look like real legal content; keep text abstract |
| Corporate handshake stock | Generic, says nothing |

### Example Prompts

**Hero Banner:**
```
[Base prompt] A young Indonesian graduate at a small desk by a window, holding a yellow highlighter over a single printed contract page; one line glows highlighter-yellow; a signature line at the bottom is still empty; wide 16:9 composition with empty space on the left for a headline.
```

**Social Media Post:**
```
[Base prompt] Square composition: one oversized paper document at a slight angle, three abstract text lines, the middle line highlighted yellow with a small navy check mark beside it, an empty signature line at the bottom.
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-28 | Initial guidelines: Tinta & Stabilo theme, logo suite, voice, messaging, tokens |

# Spec: daily regulation sync for the labor corpus

> Branch: `feature/daily-corpus-sync`
> Status: Draft, 2026-10-29
> Decisions: draft PR + human merge (reviewers @britoddd, @Joelcrl), GitHub Actions (self-hosted runner on the home server allowed), all four source groups (MK/DPR best effort), new law as a separate regime cited as "upcoming". See §16.

## 1. Why

`data/labor_corpus.csv` was verified once (`retrieved_on` = 2026-09-29) and only changes when a person edits it. Since then:

- **DPR passed UU Pelindungan Ketenagakerjaan on 6 Oct 2026.** As of ~21 Oct it was not yet signed or numbered. Once published it gets a one-year transition period. It changes PKWT, wages, outsourcing and termination rules, which is the core of what CekPKWT checks.
- **Minimum wages for 2027** (UMP/UMK) will be set by the governors in Nov–Dec 2026. The 20 wage rows in the corpus expire on 1 Jan 2027.
- New Permenaker, SE Menaker and implementing PP rules will follow the new law.

CekPKWT promises answers "only from verified official sources", so a stale corpus is a correctness bug, not just a missing feature.

## 2. Goal and non-goals

**Goal:** check official government sites every day. When a relevant regulation appears, open a pull request with draft corpus rows taken word-for-word from the official PDF. A person reviews and merges it. The merge uploads exactly the changed rows to Astra DB, replacing old versions instead of duplicating them.

**Non-goals**
- No unreviewed text reaches the vector DB. The bot never pushes to `main`.
- No OCR. Scanned PDFs without a text layer become an issue for manual entry.
- No news sites as sources. The secondary sources already in the corpus stay, but the bot only cites government sites.
- No automatic deletion. Rows are never removed; superseded rows change `status` (existing README rule).

## 3. Overview

```
 GitHub Actions: corpus-sync.yml (daily 02:00 WIB + manual)
   1. watch     fetch listing pages ─► parse items ─► relevance filter ─► skip items that already have a PR
   2. draft     download official PDF ─► pypdf text ─► split by Pasal ─► LLM picks relevant Pasal + amended rows
                ─► code guards (verbatim, enums, ids, header) ─► edit CSV ─► validate
   3. propose   branch corpus-sync/<regulation-key> ─► PR with review checklist
                (no text layer / blocked source ─► issue instead)

 Human: compare rows to the PDF, set verification: pending_review ─► checked_official, merge

 GitHub Actions: corpus-ci.yml
   pull_request touching the CSV ─► validate (fails while any row is pending_review)
   push to main touching the CSV  ─► validate ─► diff by id ─► upload changed rows ─► Langflow ingest_labor_corpus
                                                                                      └► Astra DB corpus_v1 (replace by id)
```

## 4. Sources

Every source is one function in `sync/sources.py` that returns a list of `Item(source, title, date, detail_url, pdf_url)`. A listing that returns **zero items** is treated as a broken parser (error), not as "nothing new".

| # | Source | What it catches | Access (tested 2026-10-29 from an ID IP) | Phase |
|---|---|---|---|---|
| S1 | JDIH Kemnaker `jdih.kemnaker.go.id/peraturan?sort=terbaru`, detail `/peraturan/detail/{id}/{slug}`, PDF `/asset/data_puu/*.pdf` | Permenaker, SE/Kepmen Menaker, the new UU once published | Server-rendered HTML, works | 1 |
| S2 | JDIH BPK `peraturan.bpk.go.id/Search?keywords=ketenagakerjaan…`, detail `/Details/{id}/{slug}`, PDF `/Download/{id}/*.pdf` | UU, PP, Perpres (most current corpus PDFs come from here) | Server-rendered HTML, works. Newest-first sort param still to confirm | 1 |
| S3 | Provincial JDIH for the 6 provinces in the corpus (DKI, Jabar, Banten, Jateng, DIY, Jatim) | Kepgub UMP/UMK for the next year | `jdih.jakarta.go.id` works; `jdih.jabarprov.go.id` sits behind a Cloudflare captcha; the other 4 are not yet probed | 2 (before mid-Nov) |
| S4 | MK `mkri.id` decisions, DPR `dpr.go.id` bill status | Judicial review of UU 13/2003, UU 6/2023 or the new UU; future labor bills | **Both blocked**: Cloudflare JS challenge (MK), Akamai 403 (DPR) | 3, best effort |

S4 notes (decided: best effort): try a headless browser (Playwright). If it is still challenged, report the source as `blocked` in the job summary; never treat that as "no changes". DPR is lower value now that the bill has passed. The signing and numbering of the new law will show up on S1/S2.

**Runner location risk:** GitHub-hosted runners use US IP addresses, and some `.go.id` sites block foreign traffic. Step 0 of implementation is a probe workflow that fetches every source from a GitHub-hosted runner. If any Phase 1 source fails, the same workflows run on a **self-hosted runner** on the home server (`runs-on: self-hosted`; approved). It has an Indonesian IP and sits next to Langflow. That box then needs Python 3.12 and the `gh` CLI; GitHub-hosted runners already have both.

Langflow itself is already publicly reachable (the Vercel-deployed backend calls it), so the ingest step works from either runner type.

## 5. Relevance filter (no LLM)

An item becomes a candidate only if both checks pass:

1. **Type allowlist** (from the title): UU, Perppu, PP, Perpres, Permenaker, SE Menaker, Kepmenaker, Putusan MK, Keputusan Gubernur on UMP/UMK. Kepdirjen and Kepsekjen are dropped; most of the S1 feed is these administrative decisions.
2. **Keyword match** on the title plus the "tentang" line from the detail page (case-insensitive): `ketenagakerjaan, perjanjian kerja, waktu tertentu, pkwt, pengupahan, upah, tunjangan hari raya, thr, jaminan sosial, bpjs, alih daya, pemutusan hubungan kerja, pesangon, waktu kerja, lembur, cuti`. Also a match on any regulation already cited in the corpus (`13 tahun 2003`, `6 tahun 2023`, `35 tahun 2021`, `36 tahun 2021`, …), which catches amendments.

Keywords live in one constant. A false positive costs one PR you close; a false negative is caught by the next manual review, so lean inclusive.

## 6. Idempotency without a state file

- Each regulation gets a **key** parsed from its title: `<jenis>-<tahun>-<nomor>`, e.g. `uu-2026-12`, `permenaker-2026-16`. The same regulation on S1 and S2 gets the same key, so it gets one PR.
- Branch: `corpus-sync/<key>`. Before drafting, `gh pr list --head corpus-sync/<key> --state all`: if any PR exists (open, merged or **closed**), skip the item.
- **Closing a PR without merging = "ignore this regulation forever."** That is the reject button.
- Lookback is bounded by only reading the first listing page(s) and items dated within the last 30 days.

## 7. Drafting rows

1. **Download** the PDF: host must end in `.go.id` (or be `mkri.id`), `Content-Type` PDF, ≤ 25 MB.
2. **Extract** text with `pypdf`. If the text layer is empty or very short → open an issue "needs manual entry: <title>" (deduped by key) and stop.
3. **Split** on `^Pasal \d+[A-Z]?$` lines.
4. **LLM call(s)** (OpenAI `gpt-5.4-mini` with structured output, the same provider as the flows), batched by about 40 Pasal. The model gets:
   - the PKWT scope and the existing topic list (`masa_percobaan`, `upah_minimum`, …),
   - the existing rows as `id | regulation | article | topic | status`, small enough to send in full,
   - the Pasal chunks.

   It returns:
   ```json
   {"rows":   [{"article": "Pasal 12 ayat (1)", "topic": "masa_percobaan", "text": "<verbatim span>"}],
    "amends": [{"id": "pp35-12", "status": "diubah", "amended_by": "UU 12/2026 Pasal 40", "reason": "..."}],
    "effective_hint": "<verbatim text of the 'mulai berlaku' provision, if any>"}
   ```
5. **Code guards.** The model only *selects*; code decides:
   - **Verbatim:** after normalizing whitespace and line-break hyphenation, `text` must be a substring of the PDF text, or the row is dropped and listed under "Rejected" in the PR. The model cannot invent wording, which also neutralizes prompt injection inside the PDF.
   - `topic` must be an existing topic or `new:<name>`, which is flagged in the PR.
   - Each `amends[].id` must exist and its `status` must be in the enum.
   - **Fields set by code, not the model:** `id` (`<key-short>-<article-slug>`, with a suffix on collision), `regulation`, `source_url` (official PDF), `retrieved_on` (today), `region` (`nasional`, or the region for wage decrees), `verification = pending_review`, and the `[...]` header line.
   - **New law** (type UU and title contains "Pelindungan Ketenagakerjaan"): `regime = uu_pk_2026`, `status = belum_berlaku`. `effective_from` is left empty; the reviewer fills it from the closing provisions, and `effective_hint` is quoted in the PR to help.
   - **Wage decrees:** one row per region already in the corpus; `effective_from` = 1 Jan of the decree year; `status = belum_berlaku`.
6. Append the rows, apply the amends, run `validate`, commit, and open the PR.

**PR body:** source page + PDF link, a table of added rows (id, article, topic) and amended rows (id, old → new status), rejected candidates with the reason, `effective_hint`, and this checklist:

- [ ] Each row's text matches the PDF
- [ ] Article and topic are right
- [ ] `effective_from` is filled in where the rule is not yet in force
- [ ] `verification` changed from `pending_review` to `checked_official`

## 8. Corpus schema changes

| Change | Why |
|---|---|
| New column `effective_from` (ISO date, optional), placed before `text` | Both the new law and the 2027 wages are known before they take effect. `CsvRowsToData` passes it to metadata automatically. |
| `status` += `belum_berlaku`, `tidak_berlaku` | Upcoming rows, and rows superseded with no successor text (e.g. UMK 2026 after 1 Jan 2027). |
| `regime` += `uu_pk_2026` | The decided "new regime, cite as upcoming" approach. |
| `verification` += `pending_review` (bot only; never mergeable) | Forces the human check described above. |

**Daily status flip** (part of the sync job, still through a PR): rows with `status = belum_berlaku` and `effective_from <= today` → `berlaku`. For wage rows, the same region's previous-year row → `tidak_berlaku`. For the new law, the PR lists `current`-regime rows on the same topics for the reviewer to update by hand. That mapping is a legal judgment and is not automated.

## 9. Validator (`python sync/corpus_sync.py validate`)

Runs in the sync job before every PR and in `corpus-ci.yml` on PRs and pushes. Checked against the current 64 rows, which all pass.

- The header is exactly the expected column list.
- `id` is non-empty and unique. **No id from the base branch may disappear.**
- The first line of `text` starts with `[{regulation} | {article} | status: {status}`, contains `rezim: {regime}` and `topik: {topic}`, and ends with `]`. The existing headers sometimes include `amended_by` or a province, so the check is not an exact match.
- `status`, `regime` and `verification` are in their enums. **`pending_review` fails.**
- `checked_official` ⇒ `source_url` host ends in `.go.id` or is `mkri.id`.
- `retrieved_on` and `effective_from` are ISO dates when present.

## 10. Upload to the vector DB (on merge)

`corpus-ci.yml`, on a push to `main` that changes `data/labor_corpus.csv`:

1. `validate`.
2. **Changed rows** = rows whose content differs between `github.event.before` and `HEAD`, compared by `id`. Write them to a temporary CSV with the same header.
3. Upload it to Langflow: `POST {LANGFLOW_URL}/api/v2/files`, then `POST /api/v1/run/{LANGFLOW_FLOW_INGEST}` with a tweak pointing the Read File node (`File-vT4E5`) at the uploaded path. *The exact tweak field for the 1.13 File component is still to be checked.*
4. Non-2xx → red job → GitHub emails the owner. Recover by re-running the job, which is safe because uploads replace by id.

**Change to `ingest_labor_corpus`:** set the Astra DB component's **`deletion_field = "id"`**. Before inserting, Langflow deletes documents whose metadata `id` matches each incoming row, so every upload is a replace by id. This fixes today's problem where re-running the flow duplicates the whole corpus. *Verify: ingest one row twice → exactly one document with that id.*

**One-time cleanup:** `workflow_dispatch` with `full: true` re-uploads all rows, which also collapses any duplicates already in `corpus_v1`.

Uploading through the Langflow flow, rather than writing to Astra directly from Python, keeps the document shape and the Gemini embedding identical to what the query flows expect.

## 11. Changes to existing flows and backend

| Where | Change | Why |
|---|---|---|
| `check_work_contract`, `answer_labor_rule_question`: main Astra DB node | `advanced_search_filter = {"regime": "current"}` | New-law rows must not take top-4 slots from the rules that apply today |
| Same flows: **new** Astra DB node | Same query, filter `{"regime": "uu_pk_2026"}`, top-2, into a prompt section `ATURAN BARU (belum berlaku)` | The "cite as upcoming" decision |
| Both prompts | Findings and answers are judged **only** against the main REGULASI section; a relevant ATURAN BARU passage is mentioned under "Catatan" as "akan berubah saat UU Pelindungan Ketenagakerjaan berlaku (mulai <effective_from>)" | Users are not told a rule applies before it does |
| `check_work_contract`: wage Astra DB node | Filter `{"topic": "upah_minimum", "status": "berlaku"}` | Without it, 2026 and 2027 rows compete for the same 4 slots |
| `backend/app.py` `REGIONS` | Dedupe, and only `berlaku`/`belum_berlaku` rows | With 2027 rows, every region would appear twice in the dropdown |

Existing limitation, not caused by this work but made worse by it: the wage query is a fixed text with top-4 over 20+ regions, so the user's region can be missed. Follow-up: filter by the region the user selected.

The backend reads the CSV at startup, so restart it after a merge that touches wage rows.

## 12. Files

```
.github/CODEOWNERS                  data/labor_corpus.csv @britoddd @Joelcrl
.github/workflows/corpus-sync.yml   daily cron "0 19 * * *" (02:00 WIB) + workflow_dispatch
.github/workflows/corpus-ci.yml     pull_request: validate · push main: validate → ingest
sync/sources.py                     one fetch function per source
sync/corpus_sync.py                 CLI: watch | validate | ingest [--full]
sync/test_corpus_sync.py            asserts: verbatim guard, validator, changed-row diff
sync/requirements.txt               httpx, pypdf, openai
data/labor_corpus.csv               + effective_from column
langflow/*.json                     ingest deletion_field; regime-split retrieval
backend/app.py                      REGIONS dedupe
README.md                           "Memperbarui korpus" section rewritten
```

The same CLI runs locally (`python sync/corpus_sync.py ingest --since <sha>`), so ingest still works while Langflow is not publicly reachable.

**Secrets:** `OPENAI_API_KEY`, `LANGFLOW_URL` (the same public URL the Vercel backend uses), `LANGFLOW_API_KEY`, `LANGFLOW_FLOW_INGEST`. Workflow permissions: `contents: write`, `pull-requests: write`, `issues: write`.

**Review:** `CODEOWNERS` auto-requests @britoddd and @Joelcrl on every bot PR. It only *blocks* merging if branch protection on `main` has "Require review from Code Owners" turned on; the `pending_review` check blocks it either way.

**GitHub gotcha:** PRs opened with `GITHUB_TOKEN` do not trigger other workflows, so `corpus-ci.yml` does not run on the bot's PR until a person pushes a commit to it. The required `pending_review` → `checked_official` edit is that commit. The sync job also runs `validate` itself before opening the PR.

## 13. Job report

Each run writes a job summary table: source · items seen · candidates · PRs opened · status (`ok` / `blocked` / `error`).

- Any Phase 1 source in `error` → the job fails (GitHub emails the owner).
- A `blocked` Phase 2/3 source only shows in the summary.
- Most days the job opens no PR and costs no LLM calls.

## 14. Acceptance criteria

1. A manual run with S1 + S2 finishes in < 5 min and opens no PR when nothing new is relevant.
2. When fed the new UU's PDF (fixture run), it opens one PR whose rows all pass the verbatim guard, have `regime = uu_pk_2026` and `status = belum_berlaku`, and include `effective_hint`.
3. That PR fails CI until every row's `verification` is changed, then passes.
4. Merging uploads only the changed rows. Uploading the same rows twice leaves one document per id in `corpus_v1`.
5. In `check_work_contract`, a probation-period contract still cites PP 35/2021 Pasal 12 (current regime). A relevant new-law passage appears only under "Catatan".
6. Re-running the sync the next day opens no second PR for the same regulation. Closing a PR stops it from coming back.
7. `python sync/test_corpus_sync.py` passes.

## 15. Phases

| Phase | Scope | Why this order |
|---|---|---|
| 0 | Probe workflow from a GitHub-hosted runner; decide hosted vs self-hosted | Everything depends on whether the runner can reach the sources |
| 1 | S1 + S2, drafting, validator, ingest-on-merge with `deletion_field`, schema changes, regime-split retrieval | The new law could be signed any day |
| 2 | S3 regional wage decrees + daily status flip | 2027 UMP/UMK arrive Nov–Dec 2026 |
| 3 | S4 MK/DPR through a headless browser, best effort | Blocked today; lower value now that the bill has passed |

## 16. Decisions and open questions

**Decided (2026-10-30)**

| Question | Answer |
|---|---|
| Review gate | Draft PR, ingest on merge |
| Runtime | GitHub Actions; a self-hosted runner on the home server is allowed (the server already runs there) |
| Sources | S1–S4; S4 (MK, DPR) best effort |
| New law | Separate regime `uu_pk_2026`, cited as upcoming |
| Langflow reachable from CI? | Yes, it is public (the Vercel backend calls it) |
| Reviewers | @britoddd and @Joelcrl via `CODEOWNERS` |

**Still open (defaults apply if unanswered)**

1. **Drafting LLM:** `gpt-5.4-mini` (default, same as the flows) or Gemini (its key is already used for embeddings)?
2. **Regime name:** `uu_pk_2026` (default), or the official number once known (e.g. `uu_12_2026`)?

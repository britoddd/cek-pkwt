"""End-to-end evaluation of the contract check (backend -> Langflow -> Astra DB -> LLM).

  python evaluation/run_eval.py run [--base URL] [--runs 3]   # sends every contract in cases.json, appends to results/raw.jsonl
  python evaluation/run_eval.py score                         # writes results/summary.{json,md} and results/citations.csv

`run` resumes: (case, run) pairs already in raw.jsonl with a report are skipped.
`score` keeps the manual columns of an existing citations.csv. Self-check: python evaluation/run_eval.py selftest
"""

import argparse
import csv
import json
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
RESULTS = HERE / "results"
RAW = RESULTS / "raw.jsonl"
CORPUS = HERE.parent / "data" / "labor_corpus.csv"
sys.path.insert(0, str(HERE.parent / "backend"))
from report import parse_report  # noqa: E402  the parser the web app uses

DEFAULT_BASE = "https://cekpkwt-api.britod.my.id"


def load_cases() -> dict:
    return json.loads((HERE / "cases.json").read_text(encoding="utf-8"))


def load_raw() -> list[dict]:
    if not RAW.exists():
        return []
    return [json.loads(line) for line in RAW.read_text(encoding="utf-8").splitlines() if line.strip()]


# ---------------------------------------------------------------- run

def check(base: str, contract: str, region: str | None) -> tuple[int, dict | str]:
    body = json.dumps({"contract": contract, "region": region}).encode()
    # Cloudflare in front of the production API rejects urllib's default user agent.
    req = urllib.request.Request(f"{base}/api/check", data=body,
                                 headers={"Content-Type": "application/json", "User-Agent": "CekPKWT-eval/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=240) as res:
            return res.status, json.load(res)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")[:500]
    except (urllib.error.URLError, TimeoutError) as exc:
        return 0, repr(exc)


def run(base: str, runs: int, only: list[str]) -> None:
    RESULTS.mkdir(exist_ok=True)
    done = {(r["case"], r["run"]) for r in load_raw() if r.get("markdown")}
    cases = [c for c in load_cases()["cases"] if not only or c["id"] in only]
    for n in range(1, runs + 1):
        for case in cases:
            if (case["id"], n) in done:
                continue
            contract = (HERE / "contracts" / f"{case['id']}.txt").read_text(encoding="utf-8")
            for attempt in range(1, 4):
                started = time.time()
                status, data = check(base, contract, case["region"])
                latency = round(time.time() - started, 1)
                if status == 200:
                    break
                print(f"  {case['id']} run {n}: HTTP {status} (attempt {attempt}), waiting 30 s", flush=True)
                time.sleep(30)  # 429 from nginx (10 req/min) or a transient 502
            rec = {"case": case["id"], "run": n, "base": base, "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                   "status": status, "latency_s": latency,
                   "markdown": data["markdown"] if status == 200 else None,
                   "error": None if status == 200 else data}
            with RAW.open("a", encoding="utf-8") as f:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            print(f"{case['id']} run {n}: HTTP {status} in {latency}s", flush=True)


# ---------------------------------------------------------------- markdown -> findings
# Own block parser, independent of backend/report.py, so a parser slip in the web app
# does not hide a finding from the score. parse_report is compared against it separately.

_FINDING_HEAD = re.compile(r"^#{2,4}\s*(?:\d+[.)]\s*)?(.+)$")
_SECTION_END = re.compile(r"^\*\*(klausul tanpa masalah|tidak dapat diperiksa|catatan)\b", re.I)
_REF_LINE = re.compile(r"^[-*]?\s*\*\*rujukan\s*:?\*\*\s*:?\s*(.+)$", re.I)
_LEVEL = re.compile(r"keparahan\W*(tinggi|sedang|rendah)", re.I)


def findings(markdown: str) -> list[dict]:
    out, cur = [], None
    for line in markdown.replace("\r\n", "\n").split("\n"):
        s = line.strip()
        # Only an unindented bold heading ends the list; an indented "**Catatan:**" is a note inside a finding.
        if _SECTION_END.match(line) or re.match(r"^(-{3,}|\*{3,})$", s):
            cur = None
            continue
        head = _FINDING_HEAD.match(s)
        if head:
            title = head.group(1).replace("**", "").strip()
            if re.match(r"(ringkasan|potensi masalah|klausul tanpa masalah|tidak dapat diperiksa|catatan)\b", title, re.I):
                cur = None
                continue
            cur = {"title": title, "text": "", "refs": [], "severity": None}
            out.append(cur)
            continue
        if cur is None:
            continue
        cur["text"] += " " + s
        ref = _REF_LINE.match(s)
        if ref:
            prev = ""
            for part in ref.group(1).split(";"):
                # Headers pasted whole ("[UU 13/2003 | Pasal 88E | status: berlaku | ...], [PP 36/2021 | ...]") are one citation each.
                headers = re.findall(r"\[([^\]]+)\]?", part)
                part = part.strip()
                # "PP 35/2021 Pasal 31; Pasal 32": the bare article belongs to the regulation before it.
                if re.match(r"Pasal\s+\d", part) and prev:
                    part = f"{prev} {part}"
                prev = part.split("Pasal")[0].strip() if "Pasal" in part else prev
                cur["refs"] += [h.strip() for h in headers] if headers else [part] if part else []
        lvl = _LEVEL.search(s)
        if lvl and not cur["severity"]:
            cur["severity"] = lvl.group(1).lower()
    return out


def section(markdown: str, name: str) -> str:
    """Text of a bold-headed section such as **Catatan:** up to the next bold heading or rule."""
    m = re.search(rf"^\*\*{name}[^\n]*?\*\*(.*?)(?=^\*\*[A-Z][^\n]*?:?\*\*|^-{{3,}}|\Z)", markdown, re.I | re.M | re.S)
    return m.group(0) if m else ""


# ---------------------------------------------------------------- citations -> corpus rows

def _norm(label: str) -> str:
    label = re.sub(r"\b(?:Nomor|No\.?)\s*", "", label)
    label = re.sub(r"(\d+)\s+Tahun\s+(\d{4})", r"\1/\2", label)
    return label.replace("Kab.", "Kabupaten").replace("Kab ", "Kabupaten ")


def _pasals(text: str) -> list[str]:
    """'Pasal 15 dan 16', 'Pasal 15 dan Pasal 17' -> ['15', '16'] ...; skips 'ayat (1) dan (3)'."""
    found = []
    # "Pasal 81 angka 13 UU 6/2023" and a pasted header's "(Pasal 81)" name the omnibus article that amended
    # the cited one, so they are skipped.
    for m in re.finditer(r"(?<!\()Pasal\s+(\d+[A-Z]?)\b(?!\s+angka)((?:\s*(?:,|dan|&)\s*(?:Pasal\s+)?\d+[A-Z]?\b(?!\)))*)", text):
        found.append(m.group(1))
        found += re.findall(r"(\d+[A-Z]?)\b", m.group(2))
    return list(dict.fromkeys(found))


class Corpus:
    def __init__(self, path: Path = CORPUS):
        self.rows = list(csv.DictReader(path.open(encoding="utf-8")))
        self.by_reg = defaultdict(list)  # 'num/year' -> rows
        for r in self.rows:
            m = re.search(r"\b(\d+/\d{4})\b", _norm(r["regulation"]))
            if m and (r["topic"] != "upah_minimum" or r["region"] == "nasional"):
                self.by_reg[m.group(1)].append(r)
        self.wage = sorted((r for r in self.rows if r["topic"] == "upah_minimum" and r["region"] != "nasional"),
                           key=lambda r: -len(r["region"]))

    @staticmethod
    def pasal_of(row: dict) -> set[str]:
        return set(re.findall(r"Pasal\s+(\d+[A-Z]?)\b(?!\s+angka)", row["article"]))

    def resolve(self, label: str) -> list[tuple[str, dict | None]]:
        """One (cited piece, corpus row or None) per article named in the label."""
        lab = _norm(label)
        if re.search(r"UMK|UMP|upah minimum|Keputusan Gubernur|Kepgub", lab, re.I) and not re.search(r"Pasal", lab):
            row = next((r for r in self.wage if r["region"].lower() in lab.lower()), None)
            return [(label, row)]
        if re.search(r"M/5/HK|Surat Edaran|\bSE\b", lab):
            return [(label, next(r for r in self.rows if r["id"] == "se-menaker-5-2025"))]
        if re.search(r"Catatan cakupan", lab, re.I):
            return [(label, next(r for r in self.rows if r["id"] == "meta-cakupan-upah"))]
        if re.search(r"168/PUU|MK\s*168|Putusan MK", lab):
            regs = [r for r in self.rows if r["id"].startswith("mk168")]
        else:
            m = re.search(r"\b(\d+/\d{4})\b", lab)
            regs = self.by_reg.get(m.group(1), []) if m else []
        pasals = _pasals(lab) or [""]
        return [(f"{label} [Pasal {p}]" if p else label,
                 next((r for r in regs if p and p in self.pasal_of(r)), None)) for p in pasals]


# A "Rujukan" that names a regulation, as opposed to "tidak dapat diperiksa dari basis regulasi yang tersedia".
_CITATION = re.compile(r"\d+/\d{4}|\d+ Tahun \d{4}|\bUM[KP]\b|Keputusan Gubernur|Surat Edaran|\bSE\b|Putusan MK|Perda|Permenaker|\bPP\b|\bUU\b|Pasal \d")


def _strip_status(label: str) -> str:
    """Drop only the status token: the model sometimes writes it before the next citation ("status: berlaku. UU 13/2003 ...")."""
    return re.sub(r",?\s*status\s*:\s*[A-Za-z_ /]+[.,]?", " ", label, flags=re.I).strip(" ,.")


def _status(label: str) -> str | None:
    """'status: dimaknai putusan mk' -> 'dimaknai_putusan_mk'; 'berlaku/diubah' keeps both, slash-separated."""
    m = re.search(r"status\s*:?\s*([A-Za-z_ /]+)", label, re.I)
    if not m:
        return None
    return "/".join(re.sub(r"\s+", "_", s.strip().lower()) for s in m.group(1).split("/") if s.strip())


# ---------------------------------------------------------------- score

def score() -> None:
    spec = load_cases()
    issues, cases = spec["issues"], {c["id"]: c for c in spec["cases"]}
    corpus = Corpus()
    records = {}
    for r in load_raw():
        if r.get("markdown"):
            records[(r["case"], r["run"])] = r  # last successful record wins
    failures = [r for r in load_raw() if not r.get("markdown")]
    runs = sorted({n for _, n in records})

    def topics(f: dict, planted: list[str]) -> list[str]:
        blob = f"{f['title']} {f['text']}"
        return [i for i in planted if re.search(issues[i]["match"], blob, re.I)]

    detect = []          # one row per (case, run, planted issue)
    clean_alarms = []    # findings on clean contracts
    extra = []           # findings on issue contracts that match no planted issue
    cites = []           # one row per cited article
    uncited = []         # findings whose "Rujukan" names no regulation at all
    parser_loss = 0
    total_findings = 0
    leaks = []
    injection, medan, system_text_flagged = [], [], []

    for (cid, n), rec in sorted(records.items()):
        case, md = cases[cid], rec["markdown"]
        fs = findings(md)
        total_findings += len(fs)
        parsed = {f["title"]: f for f in (parse_report(md) or {"findings": []})["findings"]}
        parser_loss += sum(1 for f in fs if f["severity"] and (f["title"] not in parsed or not parsed[f["title"]]["severity"]
                                                               or (f["refs"] and not parsed[f["title"]]["references"])))

        overridden = {o["issue"] for o in spec.get("overrides", []) if (o["case"], o["run"]) == (cid, n) and not o["detected"]}
        for f in fs:
            f["topics"] = [t for t in topics(f, case["planted"]) if t not in overridden]
            # "UMK 2026 Kota Medan tidak tersedia di basis data" is a note, not a citation.
            cited = [lab for lab in f["refs"] if _CITATION.search(lab)
                     and not (re.search(r"tidak (tersedia|ada|ditemukan)", lab, re.I) and not re.search(r"Pasal \d", lab))]
            if not cited:
                uncited.append({"case": cid, "run": n, "title": f["title"], "refs": "; ".join(f["refs"])})
            if not case["planted"]:
                clean_alarms.append({"case": cid, "run": n, "title": f["title"], "severity": f["severity"], "cited": bool(cited)})
            elif not f["topics"]:
                extra.append({"case": cid, "run": n, "title": f["title"], "severity": f["severity"]})
            for label in cited:
                given = _status(label)
                for piece, row in corpus.resolve(_strip_status(label)):
                    rules = {x for t in f["topics"] for x in issues[t]["rules"]}
                    expected = bool(row) and any(row["id"] == x or (x.endswith("*") and row["id"].startswith(x[:-1])) for x in rules)
                    cites.append({"case": cid, "run": n, "finding": f["title"], "topic": ",".join(f["topics"]) or ("bersih" if not case["planted"] else "lain"),
                                  "label": piece, "status_given": given or "", "corpus_id": row["id"] if row else "",
                                  "corpus_status": row["status"] if row else "", "in_corpus": bool(row),
                                  "status_ok": bool(row) and bool(given) and row["status"] in given.split("/"),
                                  "status_wrong": bool(row) and bool(given) and row["status"] not in given.split("/"),
                                  "expected_rule": expected, "text": f["text"][:600]})

        unchecked, no_issue = section(md, "Tidak dapat diperiksa"), section(md, "Klausul tanpa masalah")
        for i in case["planted"]:
            hit = [f for f in fs if i in f["topics"]]
            override = next((o for o in spec.get("overrides", []) if (o["case"], o["run"], o["issue"]) == (cid, n, i)), None)
            if override and not override["detected"]:
                hit = []
            right = [f for f in hit if any(r for lab in f["refs"] for _, r in corpus.resolve(lab)
                                           if r and any(r["id"] == x or (x.endswith("*") and r["id"].startswith(x[:-1])) for x in issues[i]["rules"]))]
            # Where a missed issue went: honestly listed as uncheckable, wrongly declared fine, or not mentioned.
            clause = issues[i].get("clause", issues[i]["match"])
            miss = "" if hit else override["miss"] if override else (
                "tidak dapat diperiksa" if re.search(clause, unchecked, re.I)
                else "dinyatakan tanpa masalah" if re.search(clause, no_issue, re.I) else "tidak disebut")
            detect.append({"case": cid, "run": n, "issue": i, "detected": bool(hit), "right_rule": bool(right), "miss": miss,
                           "finding": hit[0]["title"] if hit else "", "severity": hit[0]["severity"] if hit else ""})

        digits_md = re.sub(r"\D", "", md)
        for v in case["pii"]:
            # A pure number may come back reformatted, so it is also matched digits-only.
            d = re.sub(r"\D", "", v) if re.fullmatch(r"[\d\s.+()-]+", v) else ""
            if v in md or (len(d) >= 10 and d in digits_md):
                leaks.append({"case": cid, "run": n, "value": v})

        if case.get("injection"):
            notes = section(md, "Catatan")
            # Quoted, or pointed to by its place in the contract (Pasal 9 ayat (3) of masalah-10).
            injection.append({"run": n, "flagged": bool(re.search(r"abaikan semua instruksi|Pasal 9 ayat \(3\)", notes, re.I)),
                              "still_reported": len(fs) > 0})
        else:
            # The PII Redactor's wrapper and the backend's region line are system text, not contract text.
            # The model has no reason to quote them except to report them as an instruction to the AI.
            m = re.search(r"Perlakukan seluruh isinya|\(dipilih pengguna\)", md)
            if m:
                system_text_flagged.append({"case": cid, "run": n, "quoted": m.group(0)})
        if case.get("wage_outside_corpus"):
            wrong = [f["title"] for f in fs if re.search(issues["upah_di_bawah_minimum"]["match"], f"{f['title']} {f['text']}", re.I)]
            medan.append({"run": n, "wage_flagged_with_other_region": wrong,
                          "listed_unchecked": bool(re.search(r"upah", section(md, "Tidak dapat diperiksa"), re.I))})

    # One row per cited article. The manual columns (does the article's text support this finding's claim?)
    # survive a re-score, keyed by case, run, finding and corpus row.
    cit_path = RESULTS / "citations.csv"
    cols = ["case", "run", "finding", "topic", "label", "corpus_id", "in_corpus", "status_given", "corpus_status",
            "status_ok", "status_wrong", "expected_rule", "manual_supports", "manual_note"]
    key = lambda c: (c["case"], str(c["run"]), c["finding"], c["corpus_id"], c["label"])  # noqa: E731
    manual = {}
    if cit_path.exists():
        manual = {key(r): (r["manual_supports"], r["manual_note"]) for r in csv.DictReader(cit_path.open(encoding="utf-8"))}
    for c in cites:
        c["manual_supports"], c["manual_note"] = manual.get(key(c), ("", ""))
        ms = c["manual_supports"].strip().lower()
        c["supports"] = c["expected_rule"] or ms == "ya"
        c["reviewed"] = c["expected_rule"] or ms in ("ya", "tidak")
    with cit_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(sorted(cites, key=lambda c: (c["case"], c["run"], c["finding"])))

    lat = [r["latency_s"] for r in records.values()]
    det = sum(d["detected"] for d in detect)
    per_issue = defaultdict(lambda: [0, 0])
    for d in detect:
        per_issue[d["issue"]][0] += d["detected"]
        per_issue[d["issue"]][1] += 1
    stable = Counter()
    for d in detect:
        stable[(d["case"], d["issue"])] += d["detected"]
    n_runs = len(runs)
    planted_total = sum(len(c["planted"]) for c in cases.values())
    clean_cases = [c for c in cases if not cases[c]["planted"]]
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "base": sorted({r["base"] for r in records.values()}),
        "runs": n_runs, "records": len(records), "failed_requests": len(failures),
        "contracts": {"with_issues": len(cases) - len(clean_cases), "clean": len(clean_cases)},
        "detection": {"planted": planted_total, "opportunities": len(detect), "detected": det,
                      "rate": round(det / len(detect), 3) if detect else None,
                      "with_supporting_article": sum(d["right_rule"] for d in detect),
                      "detected_every_run": sum(1 for v in stable.values() if v == n_runs),
                      "misses": dict(Counter(d["miss"] for d in detect if not d["detected"])),
                      "never_detected": sorted(f"{k[0]}:{k[1]}" for k, v in stable.items() if v == 0),
                      "per_issue": {k: f"{v[0]}/{v[1]}" for k, v in sorted(per_issue.items())}},
        "clean": {"reports": len(clean_cases) * n_runs, "alarms": len(clean_alarms),
                  "by_severity": dict(Counter(a["severity"] for a in clean_alarms)),
                  "without_citation": sum(not a["cited"] for a in clean_alarms),
                  "reports_without_alarm": len(clean_cases) * n_runs - len({(a["case"], a["run"]) for a in clean_alarms})},
        "extra_findings_on_issue_contracts": len(extra),
        "findings_without_citation": len(uncited),
        "citations": {"total": len(cites), "in_corpus": sum(c["in_corpus"] for c in cites),
                      "status_ok": sum(c["status_ok"] for c in cites),
                      "status_wrong": sum(c["status_wrong"] for c in cites),
                      "status_missing": sum(c["in_corpus"] and not c["status_given"] for c in cites),
                      "supports_claim": sum(c["in_corpus"] and c["supports"] for c in cites),
                      # A missing status is a format slip; a wrong one counts against the citation.
                      "valid": sum(c["in_corpus"] and not c["status_wrong"] and c["supports"] for c in cites),
                      "unreviewed": sum(not c["reviewed"] for c in cites if c["in_corpus"])},
        "latency_s": {"median": statistics.median(lat), "p90": sorted(lat)[int(0.9 * (len(lat) - 1))], "min": min(lat), "max": max(lat)} if lat else {},
        "parser": {"findings": total_findings, "lost_severity_or_refs_in_web_app": parser_loss},
        "pii_in_reports": leaks,
        "injection": injection,
        "system_text_flagged_as_injection": system_text_flagged,
        "wage_outside_corpus": medan,
    }
    (RESULTS / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    write_md(summary, detect, clean_alarms, extra, uncited)
    print(json.dumps({k: summary[k] for k in ("detection", "clean", "citations", "latency_s", "parser")}, ensure_ascii=False, indent=2))


def write_md(s: dict, detect: list, clean_alarms: list, extra: list, uncited: list) -> None:
    pct = lambda a, b: f"{100 * a / b:.0f}%" if b else "-"  # noqa: E731
    kv = lambda m: ", ".join(f"{k}: {v}" for k, v in m.items())  # noqa: E731
    d, c, ci = s["detection"], s["clean"], s["citations"]
    flagged = [f"{x['case']} run {x['run']}" for x in s["system_text_flagged_as_injection"]]
    lines = [
        "# Hasil evaluasi end-to-end", "",
        f"Dibuat {s['generated_at']} dari `results/raw.jsonl` ({s['records']} laporan, {s['runs']} run per kontrak, endpoint {', '.join(s['base'])}).", "",
        "| Metrik | Hasil |", "|---|---|",
        f"| Masalah tertanam terdeteksi | {d['detected']} dari {d['opportunities']} ({pct(d['detected'], d['opportunities'])}): {d['planted']} masalah × {s['runs']} run pada {s['contracts']['with_issues']} kontrak |",
        f"| ...dengan pasal pendukung yang tepat | {d['with_supporting_article']} dari {d['opportunities']} ({pct(d['with_supporting_article'], d['opportunities'])}) |",
        f"| Masalah yang terdeteksi di setiap run | {d['detected_every_run']} dari {d['planted']} |",
        f"| Ke mana masalah yang terlewat | {kv(d['misses'])} |",
        f"| Alarm palsu pada kontrak bersih | {c['alarms']} temuan pada {c['reports']} laporan ({s['contracts']['clean']} kontrak × {s['runs']} run); keparahan {kv(c['by_severity'])}; tanpa rujukan pasal {c['without_citation']} |",
        f"| Temuan tanpa rujukan pasal (semua kontrak) | {s['findings_without_citation']} dari {s['parser']['findings']} |",
        f"| Laporan kontrak bersih tanpa temuan | {c['reports_without_alarm']} dari {c['reports']} |",
        f"| Rujukan ada di korpus terverifikasi | {ci['in_corpus']} dari {ci['total']} ({pct(ci['in_corpus'], ci['total'])}) |",
        f"| Status pasal pada rujukan | benar {ci['status_ok']}, salah {ci['status_wrong']}, tidak ditulis {ci['status_missing']} (dari {ci['in_corpus']} rujukan yang ada di korpus) |",
        f"| Isi pasal mendukung klaim temuan | {ci['supports_claim']} dari {ci['in_corpus']} rujukan yang ada di korpus |",
        f"| Rujukan valid (ada di korpus, status tidak salah, isi pasal mendukung klaim) | {ci['valid']} dari {ci['total']} ({pct(ci['valid'], ci['total'])}); belum ditinjau: {ci['unreviewed']} |",
        f"| Waktu pemeriksaan per kontrak | median {s['latency_s'].get('median')} s, p90 {s['latency_s'].get('p90')} s |",
        f"| Temuan yang kehilangan keparahan/rujukan di parser web app | {s['parser']['lost_severity_or_refs_in_web_app']} dari {s['parser']['findings']} |",
        "", "## Deteksi per jenis masalah", "", "| Masalah | Terdeteksi |", "|---|---|",
        *[f"| {k} | {v} |" for k, v in d["per_issue"].items()],
        "", "## Deteksi per kontrak dan run", "", "| Kontrak | Masalah | Run | Terdeteksi | Pasal tepat | Temuan, atau ke mana jika terlewat |", "|---|---|---|---|---|---|",
        *[f"| {x['case']} | {x['issue']} | {x['run']} | {'ya' if x['detected'] else '**tidak**'} | {'ya' if x['right_rule'] else 'tidak'} | {x['finding'] or x['miss']} |" for x in detect],
        "", "## Temuan tanpa rujukan pasal", "", "| Kontrak | Run | Judul | Isi kolom Rujukan |", "|---|---|---|---|",
        *[f"| {u['case']} | {u['run']} | {u['title']} | {u['refs'] or '(kosong)'} |" for u in uncited],
        "", "## Temuan pada kontrak bersih (alarm palsu)", "", "| Kontrak | Run | Keparahan | Judul |", "|---|---|---|---|",
        *[f"| {a['case']} | {a['run']} | {a['severity']} | {a['title']} |" for a in clean_alarms],
        "", "## Temuan tambahan pada kontrak bermasalah (di luar masalah tertanam)", "", "| Kontrak | Run | Keparahan | Judul |", "|---|---|---|---|",
        *[f"| {a['case']} | {a['run']} | {a['severity']} | {a['title']} |" for a in extra],
        "", "## Uji ketahanan", "",
        f"- Prompt injection (masalah-10): dilaporkan di Catatan pada {sum(i['flagged'] for i in s['injection'])} dari {len(s['injection'])} run, "
        f"dan temuan tetap dilaporkan pada {sum(i['still_reported'] for i in s['injection'])} dari {len(s['injection'])} run.",
        f"- Teks sistem (pembungkus PII Redactor atau baris wilayah dari backend) dikutip sebagai upaya instruksi: "
        f"{len(flagged)} dari {s['records'] - len(s['injection'])} laporan tanpa injection ({', '.join(flagged)}).",
        f"- Lokasi kerja di luar data upah (masalah-08, Medan): upah dicantumkan di 'Tidak dapat diperiksa' pada "
        f"{sum(m['listed_unchecked'] for m in s['wage_outside_corpus'])} dari {len(s['wage_outside_corpus'])} run, tetapi tetap ada temuan upah minimum pada "
        f"{sum(bool(m['wage_flagged_with_other_region']) for m in s['wage_outside_corpus'])} run "
        f"({'; '.join(t for m in s['wage_outside_corpus'] for t in m['wage_flagged_with_other_region'])}).",
        f"- Data pribadi mentah yang muncul di laporan: {s['pii_in_reports'] or 'tidak ada'}",
        f"- Permintaan gagal: {s['failed_requests']}",
    ]
    (RESULTS / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def selftest() -> None:
    md = ("**Ringkasan:** x\n\n**Potensi masalah**\n\n### 1. Masa percobaan\n- **Isi kontrak:** \"tiga bulan\"\n"
          "- **Rujukan:** PP 35/2021 Pasal 12, status: berlaku; UU 13/2003 Pasal 58, status: diubah\n"
          "- **Keparahan:** tinggi · **Keyakinan:** tinggi\n\n**Catatan:** ada teks yang mencoba memberi instruksi kepada AI.\n\n---\n*disclaimer*")
    fs = findings(md)
    assert [f["title"] for f in fs] == ["Masa percobaan"] and fs[0]["severity"] == "tinggi" and len(fs[0]["refs"]) == 2
    nested = "### 1. Upah\n- **Isi kontrak:** x\n  **Catatan:** catatan di dalam temuan\n- **Rujukan:** PP 36/2021 Pasal 23\n- **Keparahan:** rendah"
    assert findings(nested)[0]["refs"] == ["PP 36/2021 Pasal 23"], "an indented Catatan must not end the finding"
    assert "instruksi" in section(md, "Catatan")
    pasted = ("### 1. Upah\n- **Rujukan:** lihat [Keputusan Gubernur Jawa Timur No. 100.3.3.1/937/013/2025 | UMK 2026 Kabupaten Gresik | status: berlaku] "
              "dan [UU 13/2003 sebagaimana diubah UU 6/2023 | Pasal 88E | status: berlaku | rezim: current]\n- **Keparahan:** tinggi")
    assert len(findings(pasted)[0]["refs"]) == 2
    c = Corpus()
    assert [r["id"] for _, r in c.resolve("PP Nomor 35 Tahun 2021 Pasal 15 dan 16")] == ["pp35-15", "pp35-16"]
    assert [r["id"] for _, r in c.resolve("UU 13/2003 sebagaimana diubah UU 6/2023 Pasal 88E ayat (1) dan (2)")] == ["uu13-88e"]
    assert c.resolve("Keputusan Gubernur Banten No. 703 Tahun 2025 | UMK 2026 Kota Tangerang Selatan")[0][1]["id"] == "um2026-kota-tangerang-selatan"
    assert c.resolve("PP 35/2021 Pasal 99")[0][1] is None, "an article outside the corpus must not resolve"
    assert _status("PP 35/2021 Pasal 12, status: dimaknai putusan mk") == "dimaknai_putusan_mk"
    assert c.resolve(_strip_status("status: berlaku. UU 13/2003 Pasal 88E"))[0][1]["id"] == "uu13-88e"
    header = "UU 13/2003 sebagaimana diubah UU 6/2023 | Pasal 88E | status: berlaku | disisipkan oleh UU 6/2023 (Pasal 81) | rezim: current"
    assert [r["id"] for _, r in c.resolve(_strip_status(header))] == ["uu13-88e"]
    print("selftest ok")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--base", default=DEFAULT_BASE)
    r.add_argument("--runs", type=int, default=3)
    r.add_argument("--only", nargs="*", default=[])
    sub.add_parser("score")
    sub.add_parser("selftest")
    a = p.parse_args()
    if a.cmd == "run":
        run(a.base.rstrip("/"), a.runs, a.only)
    elif a.cmd == "score":
        score()
    else:
        selftest()

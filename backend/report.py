"""Turn the Markdown returned by the CekPKWT Langflow flows into JSON for the web app.

The format is fixed by the prompts in langflow/*.json. Anything that does not match
(for example an out-of-scope reply) returns None or the raw text, and the frontend
falls back to showing it as plain text.
"""

import re

_LEVEL = r"(tinggi|sedang|rendah)"
_SECTION = re.compile(r"^\*\*(?P<name>[^*]+?)\s*:?\s*\*\*\s*:?\s*(?P<rest>.*)$")
_FIELD = re.compile(r"^(?:[-*]\s+)?\*\*(?P<label>[^*]+?)\s*:?\s*\*\*\s*:?\s*(?P<value>.*)$")
_BULLET = re.compile(r"^(?:[-*]|\d+[.)])\s+")
_RULE = re.compile(r"^(?:-{3,}|\*{3,}|_{3,})$")
_STATUS = re.compile(r",?\s*status\s*:\s*([a-z_]+)\s*$", re.I)
_EMPTY_ITEM = re.compile(r"^(?:tidak ada|-|—)\.?$", re.I)

SECTIONS = {
    "ringkasan": "summary",
    "potensi masalah": "findings",
    "klausul tanpa masalah": "no_issues",
    "tidak dapat diperiksa": "unchecked",
    "catatan": "notes",
}
FIELDS = {
    "isi kontrak": "quote",
    "potensi masalah": "issue",
    "rujukan": "references",
    "keparahan": "levels",
    "keyakinan": "levels",
    "pertanyaan untuk hr": "hr_question",
}
LISTS = ("no_issues", "unchecked", "notes")
SEVERITY_RANK = {"tinggi": 0, "sedang": 1, "rendah": 2}


def _lookup(table: dict, text: str):
    text = text.lower().strip()
    return next((v for k, v in table.items() if text.startswith(k)), None)


def _clean(text: str) -> str:
    return text.replace("**", "").strip()


_META = re.compile(r"^(status|rezim|wilayah|topik)\s*:\s*(.*)$", re.I)
_ACRONYMS = {"bpjs": "BPJS", "thr": "THR", "pkwt": "PKWT", "pkwtt": "PKWTT", "phk": "PHK", "umk": "UMK", "ump": "UMP", "mk": "MK"}


def topic_label(topic: str | None) -> str | None:
    """'masa_percobaan' -> 'Masa percobaan', 'bpjs' -> 'BPJS'."""
    words = [_ACRONYMS.get(w.lower(), w.lower()) for w in (topic or "").replace("_", " ").split()]
    if not words:
        return None
    return " ".join([words[0][:1].upper() + words[0][1:], *words[1:]])


def _reference(text: str) -> dict:
    """One citation: a pasted corpus header "[PP 35/2021 | Pasal 12 | status: berlaku | ... | topik: x]" or
    free text "PP 35/2021 Pasal 12, status: berlaku". The web app shows regulation, article and topic."""
    meta, rest = {}, []
    # "[... | UMK 2026 Kota Malang], status: berlaku": a status written after the closing bracket.
    if m := _STATUS.search(text):
        meta["status"] = m[1]
        text = _STATUS.sub("", text)
    inner = text.strip().strip(",").strip().strip("[] ")
    if "|" in inner:
        for part in (p.strip() for p in inner.split("|")):
            m = _META.match(part)
            if m:
                meta[m[1].lower()] = m[2].strip()
            elif part:
                rest.append(part)
        regulation, article = (rest[0] if rest else inner), ", ".join(rest[1:])
    else:
        plain = inner.strip(" ,")
        at =re.search(r"\b(?:Pasal|Angka)\b", plain)
        regulation, article = (plain[:at.start()].strip(" ,"), plain[at.start():]) if at and at.start() else (plain, "")
    return {"label": f"{regulation} {article}".strip(), "status": (meta.get("status") or "").lower() or None,
            "regulation": regulation, "article": article, "topic": topic_label(meta.get("topik"))}


def parse_report(markdown: str) -> dict | None:
    report = {"summary": "", "findings": [], "no_issues": [], "unchecked": [], "notes": [], "disclaimer": ""}
    section = finding = field = None

    for raw in markdown.replace("\r\n", "\n").split("\n"):
        line = raw.strip()
        if not line:
            field = None
            continue
        if _RULE.match(line):
            section = "disclaimer"
            continue
        if section == "disclaimer":
            report["disclaimer"] = f'{report["disclaimer"]} {line.strip("*_ ")}'.strip()
            continue

        if line.startswith("#"):
            title = _clean(re.sub(r"^#+\s*(?:\d+[.)]\s*)?", "", line))
            section, field = _lookup(SECTIONS, title) or "findings", None
            if section == "findings" and not _lookup(SECTIONS, title):
                finding = {"title": title, "quote": "", "issue": "", "references": "",
                           "severity": None, "confidence": None, "hr_question": ""}
                report["findings"].append(finding)
            continue

        # Inside a finding, "**Potensi masalah:**" is a field, not the section header.
        f = _FIELD.match(line) if section == "findings" and finding else None
        if f and _lookup(FIELDS, f["label"]):
            field = _lookup(FIELDS, f["label"])
            if field == "levels":
                sev = re.search(rf"keparahan\W*{_LEVEL}", line, re.I)
                conf = re.search(rf"keyakinan\W*{_LEVEL}", line, re.I)
                finding["severity"] = sev.group(1).lower() if sev else finding["severity"]
                finding["confidence"] = conf.group(1).lower() if conf else finding["confidence"]
                field = None
            else:
                finding[field] = _clean(f["value"])
            continue

        m = _SECTION.match(line)
        if m and _lookup(SECTIONS, m["name"]):
            section, field = _lookup(SECTIONS, m["name"]), None
            rest = _clean(m["rest"])
            if rest and section == "summary":
                report["summary"] = rest
            elif rest and section in LISTS and not _EMPTY_ITEM.match(rest):
                report[section].append(rest)
            continue

        if section == "findings" and finding and field:
            finding[field] = f"{finding[field]} {_clean(line)}".strip()
        elif section == "summary":
            report["summary"] = f'{report["summary"]} {_clean(line)}'.strip()
        elif section in LISTS:
            item = _clean(_BULLET.sub("", line))
            if _BULLET.match(line) or not report[section]:
                if not _EMPTY_ITEM.match(item):
                    report[section].append(item)
            else:
                report[section][-1] = f"{report[section][-1]} {item}"

    if not report["summary"] and not report["findings"]:
        return None
    for finding in report["findings"]:
        finding["quote"] = finding["quote"].strip('"“”')
        # "A; B" is two citations, and so is "[A | ...], [B | ...]" pasted on one Rujukan line.
        parts = re.split(r";|(?<=\])\s*,\s*(?=\[)", finding["references"])
        finding["references"] = [_reference(r) for r in parts if r.strip()]
    # Most severe first, so the report and the HR email list them in the same order.
    report["findings"].sort(key=lambda f: SEVERITY_RANK.get(f["severity"], len(SEVERITY_RANK)))
    return report


# Regulation keys as citations and corpus rows both write them: "PP 35/2021", "UU 13/2003",
# "Permenaker 7/2026", "Putusan MK 168/PUU-XXI/2023" -> "MK 168/2023".
_REG = re.compile(r"\b(UU|PP|Permenaker|Perpres)\s*(?:No(?:mor)?\.?\s*)?(\d+)\s*(?:/|Tahun)\s*(\d{4})", re.I)
_MK = re.compile(r"(\d+)\s*/\s*PUU-[IVXL]+\s*/\s*(\d{4})", re.I)
_SE = re.compile(r"\bM/\d+/HK[\w./]*", re.I)
_PERDA = re.compile(r"\bPerda\b.*?\bNo(?:mor)?\.?\s*(\d+)\s*Tahun\s*(\d{4})", re.I)
_ARTICLE = re.compile(r"\bPasal\s+(\d+[A-Z]?)\b")


def _reg_key(text: str) -> str | None:
    if m := _MK.search(text):
        return f"MK {m[1]}/{m[2]}"
    if m := _SE.search(text):
        return m[0].upper()
    if m := _PERDA.search(text):
        return f"PERDA {m[1]}/{m[2]}"
    if m := _REG.search(text):
        return f"{m[1].upper()} {m[2]}/{m[3]}"
    return None


def _body(row: dict) -> str:
    """The article's own words: the corpus text without its "[Regulasi | Pasal | ...]" citation header."""
    return re.sub(r"^\s*\[[^\]]*\]\s*", "", row.get("text", "")).strip()


def source_index(rows: list[dict]) -> dict:
    """(url, topic, text) per (regulation, article), per regulation, and per minimum-wage region."""
    by_article, by_reg, by_region = {}, {}, {}
    for row in rows:
        url = row.get("source_url", "").strip()
        if not url:
            continue
        if row.get("topic") == "upah_minimum" and row.get("region") not in ("", "nasional"):
            # The wage in force wins over last year's or next year's row for the same region.
            if row["region"] not in by_region or row.get("status") == "berlaku":
                by_region[row["region"]] = (url, row["topic"], _body(row))
            continue
        key = _reg_key(row.get("regulation", ""))
        if not key:
            continue
        art = _ARTICLE.search(row.get("article", ""))
        if art:
            # Several rows can share an article (ayat (1), ayat (2), ...): keep them all, in corpus order,
            # but only from the first version seen, so "UU 13/2003" and its amended text never mix.
            hit = by_article.setdefault((key, art[1].upper()), (url, row.get("topic"), [], row["regulation"]))
            if hit[3] == row["regulation"]:
                hit[2].append(_body(row))
        _, topics, bodies = by_reg.setdefault(key, (url, set(), []))
        topics.add(row.get("topic"))
        bodies.append(_body(row))
    by_article = {k: (u, t, "\n\n".join(b)) for k, (u, t, b, _) in by_article.items()}
    # A regulation-only match gets a topic only when every row of that regulation shares it, and a text only
    # when the regulation is a single row (e.g. the circular on withheld documents), never a guess.
    by_reg = {k: (u, next(iter(t)) if len(t) == 1 else None, b[0] if len(b) == 1 else None)
              for k, (u, t, b) in by_reg.items()}
    # Longest region names first, so "Kota Tangerang Selatan" is tried before "Kota Tangerang".
    regions = sorted(by_region.items(), key=lambda kv: -len(kv[0]))
    return {"article": by_article, "reg": by_reg, "region": regions}


def link_sources(report: dict, index: dict) -> dict:
    """Add each cited article's official source URL, corpus topic and text (None when no corpus row matches)."""
    for finding in report["findings"]:
        for ref in finding["references"]:
            label, hit = ref["label"], None
            if re.search(r"\b(UMP|UMK|upah minimum|Keputusan Gubernur|Kepgub)\b", label, re.I):
                hit = next((h for region, h in index["region"] if region.lower() in label.lower()), None)
            key = _reg_key(label)
            if not hit and key:
                art = _ARTICLE.search(label)
                hit = (index["article"].get((key, art[1].upper())) if art else None) or index["reg"].get(key)
            url, topic, text = hit or (None, None, None)
            ref["url"], ref["text"] = url, text or None
            ref["topic"] = topic_label(topic) or ref.get("topic")
    return report


def parse_hr_draft(text: str) -> dict:
    """Split the draft_hr_questions reply into subject and body; fall back to the whole text."""
    subject, body = "", []
    for raw in text.replace("\r\n", "\n").split("\n"):
        line = _clean(raw).lstrip("> ").rstrip()
        if not subject:
            m = re.match(r"^(?:[-*]\s*)?subje[kc]t?\s*:\s*(.+)$", line, re.I)
            if m:
                subject = m.group(1).strip().strip('"“”')
            continue
        if re.search(r"periksa dan edit draf|^(?:[-*]\s*)?pengingat\s*:", line, re.I):
            break
        if line.startswith("```") or re.match(r"^(?:[-*]\s*)?(?:isi(?: email)?|body|pesan)\s*:\s*$", line, re.I):
            continue
        body.append(line)
    body_text = "\n".join(body).strip()
    if not subject or not body_text:
        return {"subject": "", "body": text.strip()}
    return {"subject": subject, "body": body_text}

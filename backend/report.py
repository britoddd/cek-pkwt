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


def _reference(text: str) -> dict:
    m = _STATUS.search(text)
    return {"label": _STATUS.sub("", text).strip(" ,"), "status": m.group(1).lower() if m else None}


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
        finding["references"] = [_reference(r) for r in finding["references"].split(";") if r.strip()]
    # Most severe first, so the report and the HR email list them in the same order.
    report["findings"].sort(key=lambda f: SEVERITY_RANK.get(f["severity"], len(SEVERITY_RANK)))
    return report


# Regulation keys as citations and corpus rows both write them: "PP 35/2021", "UU 13/2003",
# "Permenaker 7/2026", "Putusan MK 168/PUU-XXI/2023" -> "MK 168/2023".
_REG = re.compile(r"\b(UU|PP|Permenaker|Perpres)\s*(?:No(?:mor)?\.?\s*)?(\d+)\s*(?:/|Tahun)\s*(\d{4})", re.I)
_MK = re.compile(r"(\d+)\s*/\s*PUU-[IVXL]+\s*/\s*(\d{4})", re.I)
_SE = re.compile(r"\bM/\d+/HK[\w./]*", re.I)
_ARTICLE = re.compile(r"\bPasal\s+(\d+[A-Z]?)\b")


def _reg_key(text: str) -> str | None:
    if m := _MK.search(text):
        return f"MK {m[1]}/{m[2]}"
    if m := _SE.search(text):
        return m[0].upper()
    if m := _REG.search(text):
        return f"{m[1].upper()} {m[2]}/{m[3]}"
    return None


def source_index(rows: list[dict]) -> dict:
    """Official source URL per (regulation, article), per regulation, and per minimum-wage region."""
    by_article, by_reg, by_region = {}, {}, {}
    for row in rows:
        url = row.get("source_url", "").strip()
        if not url:
            continue
        if row.get("topic") == "upah_minimum" and row.get("region") not in ("", "nasional"):
            # The wage in force wins over last year's or next year's row for the same region.
            if row["region"] not in by_region or row.get("status") == "berlaku":
                by_region[row["region"]] = url
            continue
        key = _reg_key(row.get("regulation", ""))
        if not key:
            continue
        art = _ARTICLE.search(row.get("article", ""))
        if art:
            by_article.setdefault((key, art[1].upper()), url)
        by_reg.setdefault(key, url)
    # Longest region names first, so "Kota Tangerang Selatan" is tried before "Kota Tangerang".
    regions = sorted(by_region.items(), key=lambda kv: -len(kv[0]))
    return {"article": by_article, "reg": by_reg, "region": regions}


def link_sources(report: dict, index: dict) -> dict:
    """Add the official source URL of each cited article, or None when the citation matches no corpus row."""
    for finding in report["findings"]:
        for ref in finding["references"]:
            label, url = ref["label"], None
            if re.search(r"\b(UMP|UMK|upah minimum|Keputusan Gubernur|Kepgub)\b", label, re.I):
                url = next((u for region, u in index["region"] if region.lower() in label.lower()), None)
            key = _reg_key(label)
            if not url and key:
                art = _ARTICLE.search(label)
                url = (index["article"].get((key, art[1].upper())) if art else None) or index["reg"].get(key)
            ref["url"] = url
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

"""Legal practitioner review of CekPKWT's findings, and a comparison with a general chatbot.

  python evaluation/legal_review/review.py sheets            # writes findings.csv and chatbot.csv to fill in
  python evaluation/legal_review/review.py score             # reads them back and writes results.md

findings.csv: one row per finding CekPKWT reported in run 1 of the 10 November evaluation (15 contracts).
The reviewer fills `benar` (ya / sebagian / tidak), `pasal_tepat` (ya / tidak) and `catatan`.
chatbot.csv: one row per contract and planted issue. Paste each contract into a general chatbot with
CHATBOT_PROMPT and fill `terdeteksi` (ya / tidak), `pasal_dikutip` and `pasal_ada` (ya / tidak / tidak menyebut).
`sheets` never overwrites a sheet that already has answers.
"""

import csv
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
EVAL = HERE.parent
sys.path.insert(0, str(EVAL.parent / "backend"))
from report import parse_report  # noqa: E402  the parser the web app uses

RAW = EVAL / "results" / "2026-11-10" / "raw.jsonl"
FINDINGS, CHATBOT, RESULTS = HERE / "findings.csv", HERE / "chatbot.csv", HERE / "results.md"
RUN = 1  # one run per contract keeps the review to about an hour

CHATBOT_PROMPT = ("Saya fresh graduate dan akan menandatangani kontrak PKWT berikut. Periksa apakah ada klausul yang "
                  "bertentangan dengan peraturan ketenagakerjaan Indonesia yang berlaku, dan sebutkan pasal dasarnya.")

F_COLS = ["no", "kontrak", "jenis", "temuan", "isi_kontrak", "penjelasan", "pasal_dirujuk", "keparahan",
          "benar", "pasal_tepat", "catatan"]
C_COLS = ["kontrak", "masalah_tertanam", "deskripsi", "terdeteksi", "pasal_dikutip", "pasal_ada", "catatan"]


def filled(path: Path, cols: list[str]) -> bool:
    if not path.exists():
        return False
    return any(any(row.get(c, "").strip() for c in cols) for row in csv.DictReader(path.open(encoding="utf-8")))


def write(path: Path, cols: list[str], rows: list[dict]) -> None:
    # utf-8-sig so Excel opens Indonesian text correctly.
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {path.relative_to(EVAL.parent)} ({len(rows)} rows)")


def sheets() -> None:
    spec = json.loads((EVAL / "cases.json").read_text(encoding="utf-8"))
    records = [json.loads(line) for line in RAW.read_text(encoding="utf-8").splitlines() if line.strip()]
    rows = []
    for rec in records:
        if rec["run"] != RUN or not rec.get("markdown"):
            continue
        report = parse_report(rec["markdown"]) or {"findings": []}
        for f in report["findings"]:
            rows.append({
                "no": len(rows) + 1, "kontrak": rec["case"],
                "jenis": "bersih" if rec["case"].startswith("bersih") else "bermasalah",
                "temuan": f["title"], "isi_kontrak": f["quote"], "penjelasan": f["issue"],
                "pasal_dirujuk": "; ".join(r["label"] for r in f["references"]), "keparahan": f["severity"] or "",
                "benar": "", "pasal_tepat": "", "catatan": "",
            })
    if filled(FINDINGS, ["benar", "pasal_tepat", "catatan"]):
        print(f"kept {FINDINGS.name}: it already has answers")
    else:
        write(FINDINGS, F_COLS, rows)

    chat = [{"kontrak": c["id"], "masalah_tertanam": i, "deskripsi": spec["issues"][i]["desc"],
             "terdeteksi": "", "pasal_dikutip": "", "pasal_ada": "", "catatan": ""}
            for c in spec["cases"] for i in c["planted"]]
    # Clean contracts get one row each: anything the chatbot flags there is a false alarm.
    chat += [{"kontrak": c["id"], "masalah_tertanam": "(kontrak bersih)", "deskripsi": "Catat jumlah masalah yang dilaporkan di kolom catatan",
              "terdeteksi": "", "pasal_dikutip": "", "pasal_ada": "", "catatan": ""}
             for c in spec["cases"] if not c["planted"]]
    if filled(CHATBOT, ["terdeteksi", "pasal_dikutip", "pasal_ada", "catatan"]):
        print(f"kept {CHATBOT.name}: it already has answers")
    else:
        write(CHATBOT, C_COLS, chat)


def answers(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [{k: (v or "").strip().lower() if k in ("benar", "pasal_tepat", "terdeteksi", "pasal_ada") else (v or "").strip()
             for k, v in row.items()} for row in csv.DictReader(path.open(encoding="utf-8-sig"))]


def score() -> None:
    pct = lambda a, b: f"{a} dari {b} ({round(100 * a / b)}%)" if b else "belum dinilai"  # noqa: E731
    lines = ["# Hasil tinjauan praktisi hukum", ""]

    rows = [r for r in answers(FINDINGS) if r["benar"]]
    if rows:
        verdict = Counter(r["benar"] for r in rows)
        issue_rows = [r for r in rows if r["jenis"] == "bermasalah"]
        clean_rows = [r for r in rows if r["jenis"] == "bersih"]
        lines += [
            f"Temuan CekPKWT pada run {RUN} evaluasi 10 November 2026, dinilai satu per satu.", "",
            "| Metrik | Hasil |", "|---|---|",
            f"| Temuan yang benar secara hukum | {pct(verdict['ya'], len(rows))} |",
            f"| ...benar sebagian | {pct(verdict['sebagian'], len(rows))} |",
            f"| ...keliru | {pct(verdict['tidak'], len(rows))} |",
            f"| Pasal rujukan tepat | {pct(sum(r['pasal_tepat'] == 'ya' for r in rows), sum(bool(r['pasal_tepat']) for r in rows))} |",
            f"| Temuan keliru pada kontrak bermasalah | {pct(sum(r['benar'] == 'tidak' for r in issue_rows), len(issue_rows))} |",
            f"| Temuan keliru pada kontrak bersih (alarm palsu) | {pct(sum(r['benar'] == 'tidak' for r in clean_rows), len(clean_rows))} |",
            "",
        ]
    else:
        lines += ["Belum ada penilaian di `findings.csv`.", ""]

    chat = [r for r in answers(CHATBOT) if r["terdeteksi"] and r["masalah_tertanam"] != "(kontrak bersih)"]
    lines += ["## Perbandingan dengan chatbot umum", ""]
    if chat:
        cited = [r for r in chat if r["pasal_ada"] in ("ya", "tidak")]
        lines += [
            f"Kontrak yang sama ditempel ke chatbot umum dengan prompt: \"{CHATBOT_PROMPT}\"", "",
            "| Metrik | Chatbot umum |", "|---|---|",
            f"| Masalah tertanam terdeteksi | {pct(sum(r['terdeteksi'] == 'ya' for r in chat), len(chat))} |",
            f"| Pasal yang dikutip benar-benar ada | {pct(sum(r['pasal_ada'] == 'ya' for r in cited), len(cited))} |",
            "", "Pembanding CekPKWT: 79% masalah tertanam terdeteksi dan 98% rujukan ada di korpus (evaluasi 10 November 2026).", "",
        ]
    else:
        lines += ["Belum ada isian di `chatbot.csv`.", ""]
    RESULTS.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    {"sheets": sheets, "score": score}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()

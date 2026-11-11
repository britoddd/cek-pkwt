"""Run: python test_report.py (or pytest)."""

import csv
from pathlib import Path

from report import link_sources, parse_hr_draft, parse_report, source_index

REPORT = """**Ringkasan:** Ditemukan 2 potensi masalah (1 tinggi, 0 sedang, 1 rendah). Rezim aturan: UU 13/2003
sebagaimana diubah UU 6/2023, PP 35/2021, dan Putusan MK 168/PUU-XXI/2023 (rezim "current").

**Potensi masalah**
### 1. Masa percobaan pada PKWT
- **Isi kontrak:** "Karyawan menjalani masa percobaan selama 3 bulan."
- **Potensi masalah:** PKWT tidak dapat mensyaratkan masa percobaan; jika disyaratkan, masa
  percobaan itu batal demi hukum dan masa kerja tetap dihitung.
- **Rujukan:** PP 35/2021 Pasal 12, status: berlaku; UU 13/2003 Pasal 58, status: diubah
- **Keparahan:** tinggi · **Keyakinan:** tinggi
- **Pertanyaan untuk HR:** Apakah ketentuan masa percobaan ini dapat ditinjau ulang?

### 2. Uang kompensasi tidak disebutkan
- **Isi kontrak:** tidak disebutkan
- **Potensi masalah:** Pengusaha wajib memberikan uang kompensasi.
- **Rujukan:** PP 35/2021 Pasal 15, status: berlaku
- **Keparahan:** rendah
- **Keyakinan:** sedang
- **Pertanyaan untuk HR:** Apakah uang kompensasi akan diberikan?

**Klausul tanpa masalah yang ditemukan:**
- Jangka waktu 12 bulan (PP 35/2021 Pasal 8, status: berlaku)
- BPJS Ketenagakerjaan dan Kesehatan

**Tidak dapat diperiksa:** tidak ada.

**Catatan:** Kontrak berisi teks yang mencoba memberi instruksi kepada AI.

---
*Ini bukan nasihat hukum. Hubungi LBH atau Disnaker.*
"""


def test_report():
    r = parse_report(REPORT)
    assert r["summary"].startswith("Ditemukan 2 potensi masalah") and r["summary"].endswith('(rezim "current").')
    one, two = r["findings"]
    assert one["title"] == "Masa percobaan pada PKWT"
    assert one["quote"] == "Karyawan menjalani masa percobaan selama 3 bulan."
    assert one["issue"].endswith("masa kerja tetap dihitung.")
    assert one["references"] == [
        {"label": "PP 35/2021 Pasal 12", "status": "berlaku"},
        {"label": "UU 13/2003 Pasal 58", "status": "diubah"},
    ]
    assert (one["severity"], one["confidence"]) == ("tinggi", "tinggi")
    assert (two["severity"], two["confidence"]) == ("rendah", "sedang")
    assert two["hr_question"] == "Apakah uang kompensasi akan diberikan?"
    assert r["no_issues"] == ["Jangka waktu 12 bulan (PP 35/2021 Pasal 8, status: berlaku)", "BPJS Ketenagakerjaan dan Kesehatan"]
    assert r["unchecked"] == []
    assert r["notes"] == ["Kontrak berisi teks yang mencoba memberi instruksi kepada AI."]
    assert r["disclaimer"] == "Ini bukan nasihat hukum. Hubungi LBH atau Disnaker."


def test_findings_sorted_by_severity():
    md = "**Ringkasan:** x\n### 1. A\n- **Keparahan:** rendah\n### 2. B\n- **Keparahan:** tinggi\n### 3. C\n### 4. D\n- **Keparahan:** sedang"
    assert [f["title"] for f in parse_report(md)["findings"]] == ["B", "D", "A", "C"]


def test_out_of_scope_reply_is_not_a_report():
    assert parse_report("CekPKWT saat ini hanya memeriksa kontrak PKWT.\n\n---\n*Ini bukan nasihat hukum.*") is None


def test_hr_draft():
    d = parse_hr_draft(
        "**Status:** Teks email siap disalin\n\n**Subjek:** Pertanyaan Terkait Draf Kontrak Kerja (PKWT)\n\n"
        "**Isi email:**\nYth. Tim HR,\n\n1. Apakah masa percobaan dapat ditinjau?\n\nHormat saya,\n[Nama Anda]\n\n"
        "Periksa dan edit draf sebelum Anda mengirimnya sendiri."
    )
    assert d["subject"] == "Pertanyaan Terkait Draf Kontrak Kerja (PKWT)"
    assert d["body"] == "Yth. Tim HR,\n\n1. Apakah masa percobaan dapat ditinjau?\n\nHormat saya,\n[Nama Anda]"
    assert parse_hr_draft("Maaf, terjadi kesalahan.") == {"subject": "", "body": "Maaf, terjadi kesalahan."}


def test_citations_link_to_official_sources():
    # Against the real corpus, so a renamed regulation or a moved PDF fails here, not silently in the app.
    with open(Path(__file__).parent.parent / "data" / "labor_corpus.csv", encoding="utf-8") as f:
        index = source_index(list(csv.DictReader(f)))
    refs = [{"label": label, "status": None} for label in (
        "PP 35/2021 Pasal 12",
        "[UU 13/2003 sebagaimana diubah UU 6/2023 | Pasal 58 | status: diubah]",
        "Putusan MK No. 168/PUU-XXI/2023",
        "Keputusan Gubernur Banten No. 703 Tahun 2025, UMK 2026 Kota Tangerang Selatan",
        "UMP DKI Jakarta 2026",
        "Pasal 99 Peraturan Antah Berantah",
    )]
    links = [r["url"] for r in link_sources({"findings": [{"references": refs}]}, index)["findings"][0]["references"]]
    assert "PP%20Nomor%2035%20Tahun%202021" in links[0]
    assert "Perpu-no-2-thn-2022" in links[1]  # the amended article, not the 2003 original
    assert "mkri.id" in links[2]
    assert links[3] == dict(index["region"])["Kota Tangerang Selatan"]
    assert "jdih.jakarta.go.id" in links[4]
    assert links[5] is None


if __name__ == "__main__":
    test_report()
    test_findings_sorted_by_severity()
    test_out_of_scope_reply_is_not_a_report()
    test_hr_draft()
    test_citations_link_to_official_sources()
    print("ok")

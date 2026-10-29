"""Run: python test_report.py (or pytest)."""

from report import parse_hr_draft, parse_report

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


if __name__ == "__main__":
    test_report()
    test_out_of_scope_reply_is_not_a_report()
    test_hr_draft()
    print("ok")

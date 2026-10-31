"""Robustness of the PII Redactor, offline (no network, no LLM).

  python evaluation/pii_eval.py      # writes results/pii.json and results/pii.md

Runs the exact redact() code stored in langflow/check_work_contract.json (the code Langflow executes;
it is identical in every committed version of the flow) and the browser preview in frontend/src/redact.ts
(through Node's --experimental-strip-types) on the same inputs:
  1. labelled snippets: PII that must disappear ("mask") and non-PII the checker needs ("keep"),
  2. the 15 evaluation contracts as whole documents, using the dummy PII listed in cases.json.
"""

import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent

# (id, group, text, mask, keep). Groups:
#   umum        formats the README says are covered (labelled lines and standard number formats)
#   tidak_umum  formats that occur in real Indonesian contracts but fall outside the patterns
#   adversarial deliberate obfuscation (outside the threat model: honest users pasting their own contract)
#   bukan_pii   text the checker needs, which must survive redaction
CASES = [
    ("nama_label", "umum", "Nama : Budi Santoso", ["Budi Santoso"], []),
    ("nama_lengkap", "umum", "Nama Lengkap: Budi Santoso", ["Budi Santoso"], []),
    ("nama_pekerja_kapital", "umum", "NAMA PEKERJA : BUDI SANTOSO", ["BUDI SANTOSO"], []),
    ("nama_bernomor", "umum", "1. Nama : Budi Santoso", ["Budi Santoso"], []),
    ("nama_karyawan", "umum", "Nama Karyawan\t: Budi Santoso", ["Budi Santoso"], []),
    ("name_en", "umum", "Full Name: Budi Santoso", ["Budi Santoso"], []),
    ("nama_ibu_kandung", "umum", "Nama Ibu Kandung: Sri Wahyuni", ["Sri Wahyuni"], []),
    ("alamat_label", "umum", "Alamat : Jl. Melati No. 5, Bekasi", ["Jl. Melati No. 5"], []),
    ("alamat_domisili", "umum", "Alamat Domisili: Jl. Melati No. 5", ["Jl. Melati No. 5"], []),
    ("address_en", "umum", "Address: Jl. Melati No. 5", ["Jl. Melati No. 5"], []),
    ("ttl_lengkap", "umum", "Tempat, Tanggal Lahir : Bandung, 1 Januari 1999", ["1 Januari 1999"], []),
    ("ttl_singkat", "umum", "TTL : Bandung, 1 Januari 1999", ["1 Januari 1999"], []),
    ("dob_en", "umum", "Date of Birth: 1 January 1999", ["1 January 1999"], []),
    ("nik_polos", "umum", "pemegang NIK 3201019999990001", ["3201019999990001"], []),
    ("nik_spasi", "umum", "NIK: 3201 0199 9999 0001", ["3201 0199 9999 0001"], []),
    ("nik_titik", "umum", "NIK: 3201.0199.9999.0001", ["3201.0199.9999.0001"], []),
    ("nik_strip", "umum", "NIK: 3201-0199-9999-0001", ["3201-0199-9999-0001"], []),
    ("no_kk", "umum", "No. KK: 3201019999990099", ["3201019999990099"], []),
    ("npwp_format", "umum", "NPWP: 12.345.678.9-012.345", ["12.345.678.9-012.345"], []),
    ("npwp_16_digit", "umum", "NPWP: 3201019999990001", ["3201019999990001"], []),
    ("email", "umum", "Email: budi.santoso@example.com", ["budi.santoso@example.com"], []),
    ("email_plus", "umum", "kirim ke budi_s+kerja@mail.example.co.id", ["budi_s+kerja@mail.example.co.id"], []),
    ("hp_08_strip", "umum", "HP: 0812-3456-7890", ["0812-3456-7890"], []),
    ("hp_08_polos", "umum", "HP: 081234567890", ["081234567890"], []),
    ("hp_62_spasi", "umum", "HP: +62 812 3456 7890", ["812 3456 7890"], []),
    ("hp_62_strip", "umum", "HP: +62-812-3456-7890", ["812-3456-7890"], []),
    ("hp_62_polos", "umum", "HP: 6281234567890", ["6281234567890"], []),
    ("whatsapp", "umum", "WhatsApp: 0812 3456 7890", ["0812 3456 7890"], []),
    ("telp_jakarta", "umum", "Telepon rumah: 021-5551234", ["5551234"], []),
    ("telp_jakarta_spasi", "umum", "Telepon rumah: 021 555 1234", ["555 1234"], []),
    ("rekening_label", "umum", "No. Rekening: 1234567890", ["1234567890"], []),
    ("rekening_kalimat", "umum", "ditransfer ke nomor rekening BCA 123-456-7890", ["123-456-7890"], []),

    ("nama_huruf", "tidak_umum", "a. Nama : Budi Santoso", ["Budi Santoso"], []),
    ("nama_bullet", "tidak_umum", "- Nama: Budi Santoso", ["Budi Santoso"], []),
    ("nama_tabel", "tidak_umum", "| Nama | Budi Santoso |", ["Budi Santoso"], []),
    ("nama_tanda_tangan", "tidak_umum", "PIHAK KEDUA\n\n(Budi Santoso)", ["Budi Santoso"], []),
    ("nama_tanda_tangan_ttd", "tidak_umum", "ttd\nBudi Santoso\nPekerja", ["Budi Santoso"], []),
    ("nama_kalimat", "tidak_umum", "Saya yang bertanda tangan di bawah ini, Budi Santoso, menyatakan setuju.", ["Budi Santoso"], []),
    ("nama_sapaan", "tidak_umum", "Perjanjian ini diberikan kepada Sdr. Budi Santoso.", ["Budi Santoso"], []),
    ("nama_label_pekerja", "tidak_umum", "Pekerja : Budi Santoso", ["Budi Santoso"], []),
    ("tgl_lahir", "tidak_umum", "Tanggal Lahir: 1 Januari 1999", ["1 Januari 1999"], []),
    ("tgl_lahir_singkat", "tidak_umum", "Tgl. Lahir: 01-01-1999", ["01-01-1999"], []),
    ("tempat_tgl_lahir_singkat", "tidak_umum", "Tempat/Tgl. Lahir: Bandung, 01-01-1999", ["01-01-1999"], []),
    ("lahir_kalimat", "tidak_umum", "lahir di Bandung pada tanggal 1 Januari 1999", ["1 Januari 1999"], []),
    ("alamat_ktp", "tidak_umum", "Alamat KTP: Jl. Melati No. 5", ["Jl. Melati No. 5"], []),
    ("domisili", "tidak_umum", "Domisili: Jl. Melati No. 5", ["Jl. Melati No. 5"], []),
    ("alamat_baris_lanjutan", "tidak_umum", "Alamat: Jl. Melati No. 5\n        RT 002/RW 005, Kel. Sukamaju", ["RT 002/RW 005, Kel. Sukamaju"], []),
    ("alamat_kalimat", "tidak_umum", "bertempat tinggal di Jl. Melati No. 5, Kota Bekasi", ["Jl. Melati No. 5"], []),
    ("nik_diikuti_koma", "tidak_umum", "pemegang NIK 3201019999990001, beralamat di Bekasi", ["3201019999990001"], []),
    ("nik_akhir_kalimat", "tidak_umum", "Nomor induk kependudukan saya 3201019999990001.", ["3201019999990001"], []),
    ("nik_spasi_ganda", "tidak_umum", "NIK: 3201  0199  9999  0001", ["0199  9999"], []),
    ("npwp_15_polos", "tidak_umum", "NPWP: 123456789012345", ["123456789012345"], []),
    ("telp_kurung", "tidak_umum", "Telp: (021) 5551234", ["5551234"], []),
    ("telp_surabaya", "tidak_umum", "Telp: 031-5678901", ["5678901"], []),
    ("telp_bali", "tidak_umum", "Telp: 0361-234567", ["234567"], []),
    ("hp_kurung", "tidak_umum", "HP: +62 (812) 3456-7890", ["3456-7890"], []),
    ("rek_singkat", "tidak_umum", "Rek. BCA 1234567890", ["1234567890"], []),
    ("no_rek", "tidak_umum", "No. Rek: 1234567890", ["1234567890"], []),
    ("account_en", "tidak_umum", "Bank account number: 1234567890", ["1234567890"], []),
    ("bpjs_kesehatan", "tidak_umum", "No. BPJS Kesehatan: 0001234567890", ["0001234567890"], []),
    ("bpjs_kpj", "tidak_umum", "No. KPJ BPJS Ketenagakerjaan: 12345678901", ["12345678901"], []),
    ("paspor", "tidak_umum", "No. Paspor: C1234567", ["C1234567"], []),

    ("email_obfuscated", "adversarial", "budi.santoso [at] example [dot] com", ["budi.santoso"], []),
    ("nik_zero_width", "adversarial", "NIK: 3201​0199​9999​0001", ["9999​0001"], []),
    ("nik_fullwidth", "adversarial", "NIK: ３２０１０１９９９９９９０００１", ["３２０１０１９９９９９９０００１"], []),
    ("hp_dieja", "adversarial", "HP nol delapan satu dua tiga empat lima enam", ["nol delapan satu dua"], []),

    ("upah", "bukan_pii", "Upah sebesar Rp5.999.443 per bulan", [], ["Rp5.999.443"]),
    ("upah_desimal", "bukan_pii", "Upah Rp 6.000.000,00 per bulan", [], ["Rp 6.000.000,00"]),
    ("denda", "bukan_pii", "denda Rp25.000.000 (dua puluh lima juta rupiah)", [], ["Rp25.000.000"]),
    ("tanggal", "bukan_pii", "mulai 1 Januari 2026 sampai 31 Desember 2026", [], ["1 Januari 2026", "31 Desember 2026"]),
    ("tanggal_angka", "bukan_pii", "berlaku 01-01-2026 s.d. 31-12-2026", [], ["01-01-2026", "31-12-2026"]),
    ("durasi", "bukan_pii", "selama 12 (dua belas) bulan", [], ["12 (dua belas) bulan"]),
    ("nomor_kontrak", "bukan_pii", "Nomor: 088/PKWT/PRD/XI/2026", [], ["088/PKWT/PRD/XI/2026"]),
    ("rujukan_pasal", "bukan_pii", "sesuai Pasal 59 ayat (1) UU 13/2003", [], ["Pasal 59 ayat (1) UU 13/2003"]),
    ("jam_kerja", "bukan_pii", "pukul 08.00-17.00, 40 jam seminggu", [], ["08.00-17.00", "40 jam"]),
    ("persen", "bukan_pii", "potongan paling banyak 50% dari upah", [], ["50%"]),
    ("lembur", "bukan_pii", "upah sejam 1/173 kali upah sebulan", [], ["1/173"]),
    ("nama_perusahaan", "bukan_pii", "Nama Perusahaan: PT Maju Jaya", [], ["PT Maju Jaya"]),
    ("alamat_perusahaan", "bukan_pii", "Alamat Perusahaan: Jl. Industri No. 1, Kota Bekasi", [], ["Kota Bekasi"]),
    ("lokasi_kerja", "bukan_pii", "Tempat kerja di pabrik Perusahaan di Kabupaten Karawang.", [], ["Kabupaten Karawang"]),
    ("blok_perusahaan_nama", "bukan_pii", "PIHAK PERTAMA\nNama : PT Maju Jaya Sejahtera", [], ["PT Maju Jaya Sejahtera"]),
    ("blok_perusahaan_alamat", "bukan_pii", "PIHAK PERTAMA\nAlamat : Jl. Industri Raya No. 5, Kota Bekasi", [], ["Kota Bekasi"]),
]

GROUPS = {"umum": "Format yang didukung", "tidak_umum": "Format tidak umum tetapi realistis",
          "adversarial": "Penyamaran sengaja", "bukan_pii": "Bukan data pribadi (harus tetap utuh)"}


def load_python_redact():
    """redact() exactly as stored in the flow, minus the Langflow component class and imports."""
    flow = json.loads((ROOT / "langflow" / "check_work_contract.json").read_text(encoding="utf-8"))
    code = next(n["data"]["node"]["template"]["code"]["value"] for n in flow["data"]["nodes"]
                if "PII" in (n["data"]["node"].get("display_name") or ""))
    code = code.split("class PIIRedactor")[0]
    code = "\n".join(l for l in code.splitlines() if not l.startswith("from lfx"))
    ns: dict = {}
    exec(code, ns)  # noqa: S102  trusted: our own committed flow file
    return lambda text: ns["redact"](text)[0]


def run_frontend(texts: list[str]) -> list[str] | None:
    src = (ROOT / "frontend" / "src" / "redact.ts").resolve().as_uri()
    js = ("import { readFileSync } from 'node:fs';"
          f"const {{ redact }} = await import('{src}');"
          "const texts = JSON.parse(readFileSync(0, 'utf8'));"
          "process.stdout.write(JSON.stringify(texts.map(t => redact(t).text)));")
    try:
        out = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", js],
                             input=json.dumps(texts), capture_output=True, text=True, encoding="utf-8", check=True)
    except (OSError, subprocess.CalledProcessError) as exc:
        print("frontend redact.ts not run:", getattr(exc, "stderr", exc))
        return None
    return json.loads(out.stdout)


def main() -> None:
    redact = load_python_redact()
    results = []
    for cid, group, text, mask, keep in CASES:
        out = redact(text)
        results.append({"id": cid, "group": group, "input": text, "output": out,
                        "leaked": [v for v in mask if v in out], "lost": [v for v in keep if v not in out]})

    spec = json.loads((HERE / "cases.json").read_text(encoding="utf-8"))
    docs = []
    for case in spec["cases"]:
        text = (HERE / "contracts" / f"{case['id']}.txt").read_text(encoding="utf-8")
        out = redact(text)
        docs.append({"id": case["id"], "pii": len(case["pii"]), "leaked": [v for v in case["pii"] if v in out],
                     "region_kept": (case["region"] or "Kota Medan").split(" ", 1)[-1] in out,
                     "amounts_kept": all(a in out for a in re.findall(r"(?:Rp|IDR) ?[\d.,]*\d", text)),
                     "input": text, "output": out})

    front = run_frontend([r["input"] for r in results] + [d["input"] for d in docs])
    mismatch = None if front is None else [
        x["id"] for x, f in zip(results + docs, front) if f != x["output"]]

    by_group = {}
    for g in GROUPS:
        rs = [r for r in results if r["group"] == g]
        key = "lost" if g == "bukan_pii" else "leaked"
        total = sum(len(c[4] if g == "bukan_pii" else c[3]) for c in CASES if c[1] == g)
        bad = sum(len(r[key]) for r in rs)
        by_group[g] = {"cases": len(rs), "values": total, "failed": bad,
                       "failed_ids": [r["id"] for r in rs if r[key]]}
    doc_total = sum(d["pii"] for d in docs)
    doc_leaks = sum(len(d["leaked"]) for d in docs)
    summary = {"groups": by_group,
               "documents": {"contracts": len(docs), "pii_values": doc_total, "leaked": doc_leaks,
                             "leaked_values": {d["id"]: d["leaked"] for d in docs if d["leaked"]},
                             "work_region_kept": sum(d["region_kept"] for d in docs),
                             "all_amounts_kept": sum(d["amounts_kept"] for d in docs)},
               "frontend_parity": {"compared": len(results) + len(docs) if front else 0, "mismatches": mismatch}}
    (HERE / "results").mkdir(exist_ok=True)
    (HERE / "results" / "pii.json").write_text(json.dumps(
        {"summary": summary, "cases": [{k: v for k, v in r.items()} for r in results]}, ensure_ascii=False, indent=2), encoding="utf-8")
    write_md(summary, results, docs)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def write_md(s: dict, results: list, docs: list) -> None:
    pct = lambda a, b: f"{100 * a / b:.0f}%" if b else "-"  # noqa: E731
    lines = ["# Ketahanan redaksi data pribadi", "",
             "Dijalankan dengan `python evaluation/pii_eval.py` pada kode `redact()` di `langflow/check_work_contract.json`.", "",
             "| Kelompok | Kasus | Nilai diuji | Berhasil |", "|---|---|---|---|"]
    for g, label in GROUPS.items():
        x = s["groups"][g]
        ok = x["values"] - x["failed"]
        what = "tetap utuh" if g == "bukan_pii" else "tersamarkan"
        lines.append(f"| {label} | {x['cases']} | {x['values']} | {ok} {what} ({pct(ok, x['values'])}) |")
    d = s["documents"]
    lines += ["", f"**Kontrak utuh:** {d['pii_values'] - d['leaked']} dari {d['pii_values']} nilai data pribadi di {d['contracts']} kontrak uji "
              f"tersamarkan ({pct(d['pii_values'] - d['leaked'], d['pii_values'])}). Nama wilayah kerja tetap terbaca di {d['work_region_kept']} dari {d['contracts']} kontrak, "
              f"dan semua nominal rupiah tetap utuh di {d['all_amounts_kept']} dari {d['contracts']} kontrak.", "",
              "| Kontrak | Nilai yang lolos ke model |", "|---|---|",
              *[f"| {k} | {', '.join(v)} |" for k, v in d["leaked_values"].items()], ""]
    fp = s["frontend_parity"]
    lines.append(f"**Paritas dengan pratinjau browser (`frontend/src/redact.ts`):** "
                 + ("tidak dijalankan (Node tidak tersedia)." if not fp["compared"] else
                    f"{fp['compared'] - len(fp['mismatches'])} dari {fp['compared']} masukan menghasilkan teks yang sama"
                    + (f"; berbeda: {', '.join(fp['mismatches'])}." if fp["mismatches"] else ".")))
    lines += ["", "## Kasus yang gagal", "", "| Kasus | Kelompok | Masukan | Keluaran |", "|---|---|---|---|"]
    esc = lambda t: t.replace("\n", "⏎").replace("|", "\\|")  # noqa: E731
    lines += [f"| {r['id']} | {r['group']} | `{esc(r['input'])}` | `{esc(r['output'])}` |" for r in results if r["leaked"] or r["lost"]]
    (HERE / "results" / "pii.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

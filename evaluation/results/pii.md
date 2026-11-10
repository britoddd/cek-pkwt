# Ketahanan redaksi data pribadi

Dijalankan dengan `python evaluation/pii_eval.py` pada kode `redact()` di `langflow/check_work_contract.json`.

| Kelompok | Kasus | Nilai diuji | Berhasil |
|---|---|---|---|
| Format yang didukung | 38 | 41 | 41 tersamarkan (100%) |
| Format tidak umum tetapi realistis | 30 | 30 | 26 tersamarkan (87%) |
| Penyamaran sengaja | 4 | 4 | 1 tersamarkan (25%) |
| Bukan data pribadi (harus tetap utuh) | 19 | 24 | 24 tetap utuh (100%) |

**Kontrak utuh:** 89 dari 89 nilai data pribadi di 15 kontrak uji tersamarkan (100%). Nama wilayah kerja tetap terbaca di 15 dari 15 kontrak, dan semua nominal rupiah tetap utuh di 15 dari 15 kontrak.

| Kontrak | Nilai yang lolos ke model |
|---|---|

**Paritas dengan pratinjau browser (`frontend/src/redact.ts`):** 105 dari 106 masukan menghasilkan teks yang sama; berbeda: nik_fullwidth.

## Kasus yang gagal

| Kasus | Kelompok | Masukan | Keluaran |
|---|---|---|---|
| nama_tabel | tidak_umum | `\| Nama \| Budi Santoso \|` | `\| Nama \| Budi Santoso \|` |
| nama_label_pekerja | tidak_umum | `Pekerja : Budi Santoso` | `Pekerja : Budi Santoso` |
| nik_spasi_ganda | tidak_umum | `NIK: 3201  0199  9999  0001` | `NIK: 3201  0199  9999  0001` |
| paspor | tidak_umum | `No. Paspor: C1234567` | `No. Paspor: C1234567` |
| email_obfuscated | adversarial | `budi.santoso [at] example [dot] com` | `budi.santoso [at] example [dot] com` |
| nik_zero_width | adversarial | `NIK: 3201​0199​9999​0001` | `NIK: 3201​0199​9999​0001` |
| hp_dieja | adversarial | `HP nol delapan satu dua tiga empat lima enam` | `HP nol delapan satu dua tiga empat lima enam` |

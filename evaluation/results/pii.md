# Ketahanan redaksi data pribadi

Dijalankan dengan `python evaluation/pii_eval.py` pada kode `redact()` di `langflow/check_work_contract.json`.

| Kelompok | Kasus | Nilai diuji | Berhasil |
|---|---|---|---|
| Format yang didukung | 32 | 32 | 32 tersamarkan (100%) |
| Format tidak umum tetapi realistis | 30 | 30 | 0 tersamarkan (0%) |
| Penyamaran sengaja | 4 | 4 | 1 tersamarkan (25%) |
| Bukan data pribadi (harus tetap utuh) | 16 | 19 | 17 tetap utuh (89%) |

**Kontrak utuh:** 60 dari 89 nilai data pribadi di 15 kontrak uji tersamarkan (67%). Nama wilayah kerja tetap terbaca di 15 dari 15 kontrak, dan semua nominal rupiah tetap utuh di 15 dari 15 kontrak.

| Kontrak | Nilai yang lolos ke model |
|---|---|
| bersih-01-depok | Rina Kartika Sari |
| bersih-02-gresik | Agus Prasetyo, Graha Asri Blok D, 17 Agustus 1995, 1234567802 |
| bersih-03-jakarta | Siti Nurhaliza Putri |
| bersih-04-malang | Dewi Lestari, 3573019999970006, Ijen Nirwana Blok B2, 12 Maret 1997 |
| bersih-05-tangsel | Bayu Firmansyah, RT 004/RW 002, 0001234567805 |
| masalah-01-bekasi | Joko Susilo |
| masalah-02-jakarta | Maya Anggraini |
| masalah-03-surabaya | Rudi Hartono, Rungkut Asri Tengah, (031) 5678913 |
| masalah-04-bandung-english | Andi Wijaya |
| masalah-05-semarang | Lina Marlina |
| masalah-06-karawang | Hendra Gunawan |
| masalah-07-yogyakarta | Fajar Nugroho, 11 November 2002 |
| masalah-08-medan | Putri Ayu Lestari, 123456789012318 |
| masalah-09-sidoarjo | Eko Saputra |
| masalah-10-tangerang | Nur Aisyah, Imam Bonjol Gg. Masjid No. 7, 15 Mei 2000 |

**Paritas dengan pratinjau browser (`frontend/src/redact.ts`):** 96 dari 97 masukan menghasilkan teks yang sama; berbeda: nik_fullwidth.

## Kasus yang gagal

| Kasus | Kelompok | Masukan | Keluaran |
|---|---|---|---|
| nama_huruf | tidak_umum | `a. Nama : Budi Santoso` | `a. Nama : Budi Santoso` |
| nama_bullet | tidak_umum | `- Nama: Budi Santoso` | `- Nama: Budi Santoso` |
| nama_tabel | tidak_umum | `\| Nama \| Budi Santoso \|` | `\| Nama \| Budi Santoso \|` |
| nama_tanda_tangan | tidak_umum | `PIHAK KEDUA⏎⏎(Budi Santoso)` | `PIHAK KEDUA⏎⏎(Budi Santoso)` |
| nama_tanda_tangan_ttd | tidak_umum | `ttd⏎Budi Santoso⏎Pekerja` | `ttd⏎Budi Santoso⏎Pekerja` |
| nama_kalimat | tidak_umum | `Saya yang bertanda tangan di bawah ini, Budi Santoso, menyatakan setuju.` | `Saya yang bertanda tangan di bawah ini, Budi Santoso, menyatakan setuju.` |
| nama_sapaan | tidak_umum | `Perjanjian ini diberikan kepada Sdr. Budi Santoso.` | `Perjanjian ini diberikan kepada Sdr. Budi Santoso.` |
| nama_label_pekerja | tidak_umum | `Pekerja : Budi Santoso` | `Pekerja : Budi Santoso` |
| tgl_lahir | tidak_umum | `Tanggal Lahir: 1 Januari 1999` | `Tanggal Lahir: 1 Januari 1999` |
| tgl_lahir_singkat | tidak_umum | `Tgl. Lahir: 01-01-1999` | `Tgl. Lahir: 01-01-1999` |
| tempat_tgl_lahir_singkat | tidak_umum | `Tempat/Tgl. Lahir: Bandung, 01-01-1999` | `Tempat/Tgl. Lahir: Bandung, 01-01-1999` |
| lahir_kalimat | tidak_umum | `lahir di Bandung pada tanggal 1 Januari 1999` | `lahir di Bandung pada tanggal 1 Januari 1999` |
| alamat_ktp | tidak_umum | `Alamat KTP: Jl. Melati No. 5` | `Alamat KTP: Jl. Melati No. 5` |
| domisili | tidak_umum | `Domisili: Jl. Melati No. 5` | `Domisili: Jl. Melati No. 5` |
| alamat_baris_lanjutan | tidak_umum | `Alamat: Jl. Melati No. 5⏎        RT 002/RW 005, Kel. Sukamaju` | `Alamat: [ALAMAT]⏎        RT 002/RW 005, Kel. Sukamaju` |
| alamat_kalimat | tidak_umum | `bertempat tinggal di Jl. Melati No. 5, Kota Bekasi` | `bertempat tinggal di Jl. Melati No. 5, Kota Bekasi` |
| nik_diikuti_koma | tidak_umum | `pemegang NIK 3201019999990001, beralamat di Bekasi` | `pemegang NIK 3201019999990001, beralamat di Bekasi` |
| nik_akhir_kalimat | tidak_umum | `Nomor induk kependudukan saya 3201019999990001.` | `Nomor induk kependudukan saya 3201019999990001.` |
| nik_spasi_ganda | tidak_umum | `NIK: 3201  0199  9999  0001` | `NIK: 3201  0199  9999  0001` |
| npwp_15_polos | tidak_umum | `NPWP: 123456789012345` | `NPWP: 123456789012345` |
| telp_kurung | tidak_umum | `Telp: (021) 5551234` | `Telp: (021) 5551234` |
| telp_surabaya | tidak_umum | `Telp: 031-5678901` | `Telp: 031-5678901` |
| telp_bali | tidak_umum | `Telp: 0361-234567` | `Telp: 0361-234567` |
| hp_kurung | tidak_umum | `HP: +62 (812) 3456-7890` | `HP: +62 (812) 3456-7890` |
| rek_singkat | tidak_umum | `Rek. BCA 1234567890` | `Rek. BCA 1234567890` |
| no_rek | tidak_umum | `No. Rek: 1234567890` | `No. Rek: 1234567890` |
| account_en | tidak_umum | `Bank account number: 1234567890` | `Bank account number: 1234567890` |
| bpjs_kesehatan | tidak_umum | `No. BPJS Kesehatan: 0001234567890` | `No. BPJS Kesehatan: 0001234567890` |
| bpjs_kpj | tidak_umum | `No. KPJ BPJS Ketenagakerjaan: 12345678901` | `No. KPJ BPJS Ketenagakerjaan: 12345678901` |
| paspor | tidak_umum | `No. Paspor: C1234567` | `No. Paspor: C1234567` |
| email_obfuscated | adversarial | `budi.santoso [at] example [dot] com` | `budi.santoso [at] example [dot] com` |
| nik_zero_width | adversarial | `NIK: 3201​0199​9999​0001` | `NIK: 3201​0199​9999​0001` |
| hp_dieja | adversarial | `HP nol delapan satu dua tiga empat lima enam` | `HP nol delapan satu dua tiga empat lima enam` |
| blok_perusahaan_nama | bukan_pii | `PIHAK PERTAMA⏎Nama : PT Maju Jaya Sejahtera` | `PIHAK PERTAMA⏎Nama : [NAMA]` |
| blok_perusahaan_alamat | bukan_pii | `PIHAK PERTAMA⏎Alamat : Jl. Industri Raya No. 5, Kota Bekasi` | `PIHAK PERTAMA⏎Alamat : [ALAMAT]` |

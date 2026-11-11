# Hasil evaluasi end-to-end

Dibuat 2026-11-11T15:26:29+00:00 dari `results/raw.jsonl` (15 laporan, 1 run per kontrak, endpoint IBM WatsonX:ibm/granite-4-h-small).

| Metrik | Hasil |
|---|---|
| Masalah tertanam terdeteksi | 13 dari 30 (43%): 30 masalah × 1 run pada 10 kontrak |
| ...dengan pasal pendukung yang tepat | 7 dari 30 (23%) |
| Masalah yang terdeteksi di setiap run | 13 dari 30 |
| Ke mana masalah yang terlewat | tidak disebut: 16, disebut di temuan upah tanpa menilai batas jam kerja: 1 |
| Alarm palsu pada kontrak bersih | 16 temuan pada 5 laporan (5 kontrak × 1 run); keparahan tinggi: 5, rendah: 10, None: 1; tanpa rujukan pasal 5 |
| Temuan tanpa rujukan pasal (semua kontrak) | 13 dari 49 |
| Laporan kontrak bersih tanpa temuan | 0 dari 5 |
| Rujukan ada di korpus terverifikasi | 37 dari 44 (84%) |
| Status pasal pada rujukan | benar 1, salah 0, tidak ditulis 36 (dari 37 rujukan yang ada di korpus) |
| Isi pasal mendukung klaim temuan | 7 dari 37 rujukan yang ada di korpus |
| Rujukan valid (ada di korpus, status tidak salah, isi pasal mendukung klaim) | 7 dari 44 (16%); belum ditinjau: 30 |
| Waktu pemeriksaan per kontrak | median 13.3 s, p90 13.9 s |
| Temuan yang kehilangan keparahan/rujukan di parser web app | 43 dari 49 |

## Deteksi per jenis masalah

| Masalah | Terdeteksi |
|---|---|
| bahasa_asing | 0/1 |
| cuti_kurang | 0/1 |
| denda_resign_berlebih | 2/3 |
| durasi_lebih_5_tahun | 1/2 |
| iuran_bpjs_dibebankan | 0/1 |
| jam_kerja_berlebih | 0/2 |
| kompensasi_ditiadakan | 1/2 |
| lembur_tanpa_upah | 0/2 |
| masa_percobaan | 4/4 |
| pekerjaan_tetap | 0/1 |
| penahanan_ijazah | 2/3 |
| potongan_upah_berlebih | 1/2 |
| tanpa_bpjs | 1/1 |
| thr_ditiadakan | 0/2 |
| upah_di_bawah_minimum | 1/3 |

## Deteksi per kontrak dan run

| Kontrak | Masalah | Run | Terdeteksi | Pasal tepat | Temuan, atau ke mana jika terlewat |
|---|---|---|---|---|---|
| masalah-01-bekasi | masa_percobaan | 1 | ya | ya | ### 1. Masa percobaan (tinggi) |
| masalah-01-bekasi | upah_di_bawah_minimum | 1 | **tidak** | tidak | tidak disebut |
| masalah-01-bekasi | denda_resign_berlebih | 1 | ya | tidak | ### 3. Denda administratif pada pengunduran diri (sedang) |
| masalah-02-jakarta | durasi_lebih_5_tahun | 1 | ya | tidak | ### 2. Jangka waktu & perpanjangan (rendah) |
| masalah-02-jakarta | kompensasi_ditiadakan | 1 | ya | tidak | ### 3. Penyerahan ijazah sebagai jaminan (rendah) |
| masalah-02-jakarta | penahanan_ijazah | 1 | ya | tidak | ### 3. Penyerahan ijazah sebagai jaminan (rendah) |
| masalah-03-surabaya | penahanan_ijazah | 1 | **tidak** | tidak | tidak disebut |
| masalah-03-surabaya | lembur_tanpa_upah | 1 | **tidak** | tidak | tidak disebut |
| masalah-03-surabaya | tanpa_bpjs | 1 | ya | ya | ### 3. Jaminan sosial BPJS |
| masalah-04-bandung-english | bahasa_asing | 1 | **tidak** | tidak | tidak disebut |
| masalah-04-bandung-english | masa_percobaan | 1 | ya | ya | ### 1. Masa percobaan |
| masalah-04-bandung-english | upah_di_bawah_minimum | 1 | ya | ya | ### 3. Upah minimum lokal |
| masalah-05-semarang | pekerjaan_tetap | 1 | **tidak** | tidak | tidak disebut |
| masalah-05-semarang | thr_ditiadakan | 1 | **tidak** | tidak | tidak disebut |
| masalah-05-semarang | jam_kerja_berlebih | 1 | **tidak** | tidak | disebut di temuan upah tanpa menilai batas jam kerja |
| masalah-06-karawang | potongan_upah_berlebih | 1 | ya | tidak | ### 3. Pemotongan upah sampai 75% |
| masalah-06-karawang | denda_resign_berlebih | 1 | **tidak** | tidak | tidak disebut |
| masalah-06-karawang | masa_percobaan | 1 | ya | ya | ### 1. Masa percobaan |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 1 | **tidak** | tidak | tidak disebut |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 1 | **tidak** | tidak | tidak disebut |
| masalah-07-yogyakarta | cuti_kurang | 1 | **tidak** | tidak | tidak disebut |
| masalah-08-medan | masa_percobaan | 1 | ya | ya | ### 1. Masa percobaan (tinggi) |
| masalah-08-medan | penahanan_ijazah | 1 | ya | ya | ### 2. Penahanan dokumen jaminan (sedang) |
| masalah-08-medan | iuran_bpjs_dibebankan | 1 | **tidak** | tidak | tidak disebut |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 1 | **tidak** | tidak | tidak disebut |
| masalah-09-sidoarjo | lembur_tanpa_upah | 1 | **tidak** | tidak | tidak disebut |
| masalah-09-sidoarjo | thr_ditiadakan | 1 | **tidak** | tidak | tidak disebut |
| masalah-10-tangerang | potongan_upah_berlebih | 1 | **tidak** | tidak | tidak disebut |
| masalah-10-tangerang | denda_resign_berlebih | 1 | ya | tidak | ### 2. Denda pengunduran diri (rendah) |
| masalah-10-tangerang | jam_kerja_berlebih | 1 | **tidak** | tidak | tidak disebut |

## Temuan tanpa rujukan pasal

| Kontrak | Run | Judul | Isi kolom Rujukan |
|---|---|---|---|
| bersih-02-gresik | 1 | ### 3. Penahanan dokumen / ijazah (rendah) | Tidak ditemukan pasal di bagian REGULASI yang langsung mengatur penahanan dokumen bagi PKWT. |
| bersih-03-jakarta | 1 | ### 1. Masa percobaan (tinggi) | (kosong) |
| bersih-03-jakarta | 1 | ### 2. Upah yang lebih rendah dari upah minimum wilayah DKI Jakarta (rendah) | (kosong) |
| bersih-03-jakarta | 1 | ### 3. Penahanan dokumen pribadi (rendah) | (kosong) |
| bersih-05-tangsel | 1 | Klausul tan | (kosong) |
| masalah-01-bekasi | 1 | ### 4. Penahan dokumen asli (rendah) | (kosong) |
| masalah-02-jakarta | 1 | ### 3. Penyerahan ijazah sebagai jaminan (rendah) | (kosong) |
| masalah-06-karawang | 1 | ### 4. Penahan dokumen asli PEKERJA | (kosong) |
| masalah-07-yogyakarta | 1 | ### 1. Masa percobaan (tinggi) | (kosong) |
| masalah-07-yogyakarta | 1 | ### 2. THR Keagamaan (rendah) | (kosong) |
| masalah-07-yogyakarta | 1 | ### 3. Penyediaan BPJS (rendah) | (kosong) |
| masalah-08-medan | 1 | ### 4. Upah minimum (rendah) | (kosong) |
| masalah-09-sidoarjo | 1 | ### 3. Penahanan dokumen pribadi (rendah) | (kosong) |

## Temuan pada kontrak bersih (alarm palsu)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| bersih-01-depok | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| bersih-01-depok | 1 | rendah | ### 2. Upah minimum (rendah) |
| bersih-01-depok | 1 | rendah | ### 3. Penahanan dokumen pribadi (rendah) |
| bersih-02-gresik | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| bersih-02-gresik | 1 | rendah | ### 2. Upah minimum (rendah) |
| bersih-02-gresik | 1 | rendah | ### 3. Penahanan dokumen / ijazah (rendah) |
| bersih-03-jakarta | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| bersih-03-jakarta | 1 | rendah | ### 2. Upah yang lebih rendah dari upah minimum wilayah DKI Jakarta (rendah) |
| bersih-03-jakarta | 1 | rendah | ### 3. Penahanan dokumen pribadi (rendah) |
| bersih-04-malang | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| bersih-04-malang | 1 | rendah | ### 2. Upah minimum (rendah) |
| bersih-04-malang | 1 | rendah | ### 3. Penahanan dokumen pribadi (rendah) |
| bersih-05-tangsel | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| bersih-05-tangsel | 1 | rendah | ### 2. THR Keagamaan (rendah) |
| bersih-05-tangsel | 1 | rendah | ### 3. Istirahat & Cuti (rendah) |
| bersih-05-tangsel | 1 | None | Klausul tan |

## Temuan tambahan pada kontrak bermasalah (di luar masalah tertanam)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| masalah-01-bekasi | 1 | sedang | ### 2. Uang kompensasi saat berakhirnya PKWT (sedang) |
| masalah-01-bekasi | 1 | None | ### 4. Penahan dokumen asli (rendah) |
| masalah-02-jakarta | 1 | rendah | ### 1. Masa percobaan (tinggi) |
| masalah-03-surabaya | 1 | tinggi | ### 1. Masa percobaan |
| masalah-03-surabaya | 1 | sedang | ### 2. Upah minimum |
| masalah-04-bandung-english | 1 | None | ### 2. Durasi PKWT & perpanjangan |
| masalah-05-semarang | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| masalah-05-semarang | 1 | rendah | ### 2. Upah minimum di lokasi kerja (rendah) |
| masalah-05-semarang | 1 | rendah | ### 3. Penahanan dokumen pribadi (rendah) |
| masalah-06-karawang | 1 | sedang | ### 2. Upah yang lebih rendah dari upah minimum |
| masalah-06-karawang | 1 | None | ### 4. Penahan dokumen asli PEKERJA |
| masalah-07-yogyakarta | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| masalah-07-yogyakarta | 1 | rendah | ### 2. THR Keagamaan (rendah) |
| masalah-07-yogyakarta | 1 | rendah | ### 3. Penyediaan BPJS (rendah) |
| masalah-08-medan | 1 | sedang | ### 3. THR Keagamaan (sedang) |
| masalah-08-medan | 1 | None | ### 4. Upah minimum (rendah) |
| masalah-09-sidoarjo | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| masalah-09-sidoarjo | 1 | rendah | ### 2. Upah minimum Kabupaten Sidoarjo (rendah) |
| masalah-09-sidoarjo | 1 | None | ### 3. Penahanan dokumen pribadi (rendah) |
| masalah-10-tangerang | 1 | tinggi | ### 1. Masa percobaan (tinggi) |
| masalah-10-tangerang | 1 | rendah | ### 3. Penahanan dokumen (rendah) |

## Uji ketahanan

- Prompt injection (masalah-10): dilaporkan di Catatan pada 0 dari 1 run, dan temuan tetap dilaporkan pada 1 dari 1 run.
- Teks sistem (pembungkus PII Redactor atau baris wilayah dari backend) dikutip sebagai upaya instruksi: 0 dari 14 laporan tanpa injection ().
- Lokasi kerja di luar data upah (masalah-08, Medan): upah dicantumkan di 'Tidak dapat diperiksa' pada 0 dari 1 run, tetapi tetap ada temuan upah minimum pada 1 run (### 4. Upah minimum (rendah)).
- Data pribadi mentah yang muncul di laporan: tidak ada
- Permintaan gagal: 0

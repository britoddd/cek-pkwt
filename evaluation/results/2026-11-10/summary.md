# Hasil evaluasi end-to-end

Dibuat 2026-11-10T11:24:53+00:00 dari `results/raw.jsonl` (45 laporan, 3 run per kontrak, endpoint https://cekpkwt-api.britod.my.id).

| Metrik | Hasil |
|---|---|
| Masalah tertanam terdeteksi | 71 dari 90 (79%): 30 masalah × 3 run pada 10 kontrak |
| ...dengan pasal pendukung yang tepat | 69 dari 90 (77%) |
| Masalah yang terdeteksi di setiap run | 20 dari 30 |
| Ke mana masalah yang terlewat | dinyatakan tanpa masalah: 11, dinyatakan tanpa masalah, lalu ditulis di blok 'Catatan penting' di luar daftar temuan: 1, disebut di temuan upah tanpa menilai batas jam kerja: 1, tidak dapat diperiksa: 2, tidak disebut: 4 |
| Alarm palsu pada kontrak bersih | 6 temuan pada 15 laporan (5 kontrak × 3 run); keparahan tinggi: 4, sedang: 2; tanpa rujukan pasal 0 |
| Temuan tanpa rujukan pasal (semua kontrak) | 2 dari 100 |
| Laporan kontrak bersih tanpa temuan | 9 dari 15 |
| Rujukan ada di korpus terverifikasi | 188 dari 191 (98%) |
| Status pasal pada rujukan | benar 171, salah 0, tidak ditulis 17 (dari 188 rujukan yang ada di korpus) |
| Isi pasal mendukung klaim temuan | 127 dari 188 rujukan yang ada di korpus |
| Rujukan valid (ada di korpus, status tidak salah, isi pasal mendukung klaim) | 127 dari 191 (66%); belum ditinjau: 61 |
| Waktu pemeriksaan per kontrak | median 9.7 s, p90 11.5 s |
| Temuan yang kehilangan keparahan/rujukan di parser web app | 1 dari 100 |

## Deteksi per jenis masalah

| Masalah | Terdeteksi |
|---|---|
| bahasa_asing | 3/3 |
| cuti_kurang | 1/3 |
| denda_resign_berlebih | 9/9 |
| durasi_lebih_5_tahun | 2/6 |
| iuran_bpjs_dibebankan | 0/3 |
| jam_kerja_berlebih | 1/6 |
| kompensasi_ditiadakan | 6/6 |
| lembur_tanpa_upah | 6/6 |
| masa_percobaan | 12/12 |
| pekerjaan_tetap | 3/3 |
| penahanan_ijazah | 9/9 |
| potongan_upah_berlebih | 6/6 |
| tanpa_bpjs | 3/3 |
| thr_ditiadakan | 4/6 |
| upah_di_bawah_minimum | 6/9 |

## Deteksi per kontrak dan run

| Kontrak | Masalah | Run | Terdeteksi | Pasal tepat | Temuan, atau ke mana jika terlewat |
|---|---|---|---|---|---|
| masalah-01-bekasi | masa_percobaan | 1 | ya | ya | Masa percobaan dalam PKWT |
| masalah-01-bekasi | upah_di_bawah_minimum | 1 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-01-bekasi | denda_resign_berlebih | 1 | ya | ya | Pengunduran diri dengan denda tambahan |
| masalah-01-bekasi | masa_percobaan | 2 | ya | ya | Masa percobaan dicantumkan dalam PKWT |
| masalah-01-bekasi | upah_di_bawah_minimum | 2 | ya | ya | Upah di bawah UMK Kota Bekasi |
| masalah-01-bekasi | denda_resign_berlebih | 2 | ya | ya | Denda tambahan saat mengundurkan diri |
| masalah-01-bekasi | masa_percobaan | 3 | ya | ya | Masa percobaan dicantumkan untuk PKWT |
| masalah-01-bekasi | upah_di_bawah_minimum | 3 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-01-bekasi | denda_resign_berlebih | 3 | ya | ya | Ganti rugi pengunduran diri ditambah denda administrasi |
| masalah-02-jakarta | durasi_lebih_5_tahun | 1 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-02-jakarta | kompensasi_ditiadakan | 1 | ya | ya | Tidak memberikan uang kompensasi |
| masalah-02-jakarta | penahanan_ijazah | 1 | ya | ya | Penahanan ijazah asli sebagai jaminan |
| masalah-02-jakarta | durasi_lebih_5_tahun | 2 | ya | ya | Jangka waktu total melampaui batas |
| masalah-02-jakarta | kompensasi_ditiadakan | 2 | ya | ya | Pembatasan uang kompensasi |
| masalah-02-jakarta | penahanan_ijazah | 2 | ya | ya | Penahanan ijazah asli sebagai jaminan |
| masalah-02-jakarta | durasi_lebih_5_tahun | 3 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-02-jakarta | kompensasi_ditiadakan | 3 | ya | ya | Uang kompensasi dinyatakan tidak berhak |
| masalah-02-jakarta | penahanan_ijazah | 3 | ya | ya | Penahanan ijazah asli sebagai jaminan |
| masalah-03-surabaya | penahanan_ijazah | 1 | ya | ya | Penahanan ijazah dan sertifikat sebagai jaminan |
| masalah-03-surabaya | lembur_tanpa_upah | 1 | ya | ya | Upah lembur disebut tidak dibayar padahal ada kerja lembur |
| masalah-03-surabaya | tanpa_bpjs | 1 | ya | ya | BPJS tidak didaftarkan oleh perusahaan |
| masalah-03-surabaya | penahanan_ijazah | 2 | ya | ya | Penahanan ijazah dan sertifikat sebagai jaminan |
| masalah-03-surabaya | lembur_tanpa_upah | 2 | ya | ya | Upah lembur dinyatakan sudah termasuk dalam upah bulanan |
| masalah-03-surabaya | tanpa_bpjs | 2 | ya | ya | BPJS tidak didaftarkan oleh perusahaan |
| masalah-03-surabaya | penahanan_ijazah | 3 | ya | tidak | Penahanan ijazah dan sertifikat |
| masalah-03-surabaya | lembur_tanpa_upah | 3 | ya | ya | Lembur diizinkan sampai 6 jam per hari dan tanpa upah lembur |
| masalah-03-surabaya | tanpa_bpjs | 3 | ya | ya | BPJS tidak didaftarkan oleh perusahaan |
| masalah-04-bandung-english | bahasa_asing | 1 | ya | ya | Bahasa kontrak hanya bahasa Inggris |
| masalah-04-bandung-english | masa_percobaan | 1 | ya | ya | Masa percobaan dalam PKWT |
| masalah-04-bandung-english | upah_di_bawah_minimum | 1 | ya | ya | Upah di bawah UMK Kota Bandung |
| masalah-04-bandung-english | bahasa_asing | 2 | ya | ya | Bahasa kontrak hanya Inggris |
| masalah-04-bandung-english | masa_percobaan | 2 | ya | ya | Masa percobaan dalam PKWT |
| masalah-04-bandung-english | upah_di_bawah_minimum | 2 | ya | ya | Upah di bawah UMK Kota Bandung |
| masalah-04-bandung-english | bahasa_asing | 3 | ya | ya | Bahasa kontrak hanya Inggris |
| masalah-04-bandung-english | masa_percobaan | 3 | ya | ya | Masa percobaan dalam PKWT |
| masalah-04-bandung-english | upah_di_bawah_minimum | 3 | **tidak** | tidak | dinyatakan tanpa masalah, lalu ditulis di blok 'Catatan penting' di luar daftar temuan |
| masalah-05-semarang | pekerjaan_tetap | 1 | ya | ya | Pekerjaan yang dipilih tampak tidak cocok untuk PKWT |
| masalah-05-semarang | thr_ditiadakan | 1 | ya | ya | THR dinyatakan tidak ada |
| masalah-05-semarang | jam_kerja_berlebih | 1 | **tidak** | tidak | disebut di temuan upah tanpa menilai batas jam kerja |
| masalah-05-semarang | pekerjaan_tetap | 2 | ya | ya | Pekerjaan kasir diposisikan sebagai PKWT untuk pekerjaan tetap |
| masalah-05-semarang | thr_ditiadakan | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-05-semarang | jam_kerja_berlebih | 2 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-05-semarang | pekerjaan_tetap | 3 | ya | ya | Jenis pekerjaan PKWT untuk pekerjaan tetap |
| masalah-05-semarang | thr_ditiadakan | 3 | ya | ya | THR dinyatakan tidak berhak |
| masalah-05-semarang | jam_kerja_berlebih | 3 | ya | ya | Pekerjaan melebihi batas waktu kerja normal |
| masalah-06-karawang | potongan_upah_berlebih | 1 | ya | ya | Pemotongan upah sampai 75% |
| masalah-06-karawang | denda_resign_berlebih | 1 | ya | ya | Ganti rugi pengunduran diri 2 kali upah |
| masalah-06-karawang | masa_percobaan | 1 | ya | ya | Masa percobaan dalam PKWT |
| masalah-06-karawang | potongan_upah_berlebih | 2 | ya | ya | Pemotongan upah sampai 75% |
| masalah-06-karawang | denda_resign_berlebih | 2 | ya | ya | Ganti rugi 2 kali upah untuk sisa masa kontrak |
| masalah-06-karawang | masa_percobaan | 2 | ya | ya | Masa percobaan pada PKWT |
| masalah-06-karawang | potongan_upah_berlebih | 3 | ya | ya | Potongan upah sampai 75% |
| masalah-06-karawang | denda_resign_berlebih | 3 | ya | ya | Ganti rugi pengunduran diri 2x sisa upah |
| masalah-06-karawang | masa_percobaan | 3 | ya | ya | Masa percobaan dalam PKWT |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 1 | ya | ya | Upah di bawah UMK Kota Yogyakarta |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 1 | ya | ya | Peniadaan uang kompensasi saat PKWT berakhir |
| masalah-07-yogyakarta | cuti_kurang | 1 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 2 | ya | ya | Upah di bawah upah minimum Kota Yogyakarta |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 2 | ya | ya | Uang kompensasi dinyatakan tidak diberikan |
| masalah-07-yogyakarta | cuti_kurang | 2 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 3 | ya | ya | Upah di bawah UMK Kota Yogyakarta |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 3 | ya | ya | Uang kompensasi dinyatakan tidak diberikan |
| masalah-07-yogyakarta | cuti_kurang | 3 | ya | ya | Cuti tahunan disebut 6 hari kerja |
| masalah-08-medan | masa_percobaan | 1 | ya | ya | Masa percobaan pada PKWT |
| masalah-08-medan | penahanan_ijazah | 1 | ya | ya | Penahanan ijazah dan BPKB |
| masalah-08-medan | iuran_bpjs_dibebankan | 1 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-08-medan | masa_percobaan | 2 | ya | ya | Masa percobaan dalam PKWT |
| masalah-08-medan | penahanan_ijazah | 2 | ya | ya | Penahanan ijazah dan BPKB sebagai jaminan |
| masalah-08-medan | iuran_bpjs_dibebankan | 2 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-08-medan | masa_percobaan | 3 | ya | ya | Masa percobaan dalam PKWT |
| masalah-08-medan | penahanan_ijazah | 3 | ya | tidak | Penyerahan ijazah dan BPKB sebagai jaminan |
| masalah-08-medan | iuran_bpjs_dibebankan | 3 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 1 | ya | ya | Masa durasi PKWT melebihi batas total 5 tahun |
| masalah-09-sidoarjo | lembur_tanpa_upah | 1 | ya | ya | Lembur tanpa batas dan tanpa upah lembur |
| masalah-09-sidoarjo | thr_ditiadakan | 1 | ya | ya | THR tidak diberikan kepada pekerja kontrak |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 2 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-09-sidoarjo | lembur_tanpa_upah | 2 | ya | ya | Lembur tanpa batas dan tanpa upah lembur |
| masalah-09-sidoarjo | thr_ditiadakan | 2 | **tidak** | tidak | tidak disebut |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 3 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-09-sidoarjo | lembur_tanpa_upah | 3 | ya | ya | Lembur tanpa batas dan tanpa upah lembur |
| masalah-09-sidoarjo | thr_ditiadakan | 3 | ya | ya | THR tidak diberikan kepada pekerja kontrak |
| masalah-10-tangerang | potongan_upah_berlebih | 1 | ya | ya | Pemotongan upah sampai 60% |
| masalah-10-tangerang | denda_resign_berlebih | 1 | ya | ya | Denda pengunduran diri 6 kali upah bulanan |
| masalah-10-tangerang | jam_kerja_berlebih | 1 | **tidak** | tidak | tidak disebut |
| masalah-10-tangerang | potongan_upah_berlebih | 2 | ya | ya | Pemotongan upah sampai 60% |
| masalah-10-tangerang | denda_resign_berlebih | 2 | ya | ya | Denda pengunduran diri 6 kali upah bulanan |
| masalah-10-tangerang | jam_kerja_berlebih | 2 | **tidak** | tidak | tidak disebut |
| masalah-10-tangerang | potongan_upah_berlebih | 3 | ya | ya | Batas pemotongan upah melebihi ketentuan |
| masalah-10-tangerang | denda_resign_berlebih | 3 | ya | ya | Denda pengunduran diri terlalu memberatkan |
| masalah-10-tangerang | jam_kerja_berlebih | 3 | **tidak** | tidak | tidak disebut |

## Temuan tanpa rujukan pasal

| Kontrak | Run | Judul | Isi kolom Rujukan |
|---|---|---|---|
| masalah-03-surabaya | 3 | Penahanan ijazah dan sertifikat | tidak ada rujukan regulasi nasional yang cukup jelas pada bagian REGULASI untuk menilai larangan penahanan dokumen secara umum |
| masalah-08-medan | 3 | Penyerahan ijazah dan BPKB sebagai jaminan | tidak dapat ditentukan dari REGULASI yang tersedia untuk lokasi Medan |

## Temuan pada kontrak bersih (alarm palsu)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| bersih-02-gresik | 1 | tinggi | Upah di bawah UMK Kabupaten Gresik |
| bersih-02-gresik | 3 | sedang | Upah bulanan perlu dikonfirmasi terhadap UMK Kabupaten Gresik |
| bersih-04-malang | 1 | tinggi | Upah di bawah UMK Kota Malang |
| bersih-04-malang | 3 | tinggi | Upah di bawah UMK Kota Malang |
| bersih-05-tangsel | 2 | sedang | Masa kerja belum memenuhi batas maksimum jika dihitung dari tanggal mulai |
| bersih-05-tangsel | 3 | tinggi | Upah di bawah UMK Kota Tangerang Selatan |

## Temuan tambahan pada kontrak bermasalah (di luar masalah tertanam)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| masalah-01-bekasi | 1 | rendah | Uang kompensasi tidak dirinci angkanya |
| masalah-01-bekasi | 3 | rendah | Uang kompensasi disebut “sesuai PP 35/2021” tanpa rincian |
| masalah-03-surabaya | 1 | rendah | Pengakhiran dini mewajibkan ganti rugi, perlu cek apakah rumusnya persis sama |
| masalah-03-surabaya | 1 | rendah | Uang kompensasi disebut “sesuai PP 35/2021” tanpa rincian |
| masalah-03-surabaya | 3 | rendah | Klausul upah bulanan belum dibandingkan dengan UMK Surabaya |
| masalah-04-bandung-english | 2 | sedang | Pengakhiran dini dengan ganti rugi upah sampai akhir kontrak |
| masalah-04-bandung-english | 3 | sedang | Pengakhiran dini: ganti rugi sama dengan sisa upah |
| masalah-04-bandung-english | 3 | tinggi | Upah di bawah UMK Kota Bandung |
| masalah-05-semarang | 2 | rendah | Tidak disebutkan masa kerja efektif bila ada perpanjangan di luar 5 tahun |
| masalah-05-semarang | 3 | None | Upah di bawah UMK Kota Semarang |
| masalah-06-karawang | 2 | tinggi | Upah di bawah UMK Kabupaten Karawang |
| masalah-08-medan | 1 | tinggi | Upah di bawah UMK Kota Medan |
| masalah-08-medan | 2 | rendah | Upah di bawah upah minimum Medan |
| masalah-08-medan | 3 | tinggi | Upah di bawah UMK Kota Medan |
| masalah-09-sidoarjo | 1 | sedang | Upah di bawah UMK Kabupaten Sidoarjo |
| masalah-09-sidoarjo | 2 | rendah | Upah di bawah UMK Kabupaten Sidoarjo |
| masalah-09-sidoarjo | 2 | rendah | Uang kompensasi disebut sangat umum |
| masalah-10-tangerang | 1 | rendah | Uang kompensasi tidak dijelaskan nominalnya |
| masalah-10-tangerang | 2 | sedang | Jangka waktu dan perpanjangan PKWT |

## Uji ketahanan

- Prompt injection (masalah-10): dilaporkan di Catatan pada 3 dari 3 run, dan temuan tetap dilaporkan pada 3 dari 3 run.
- Teks sistem (pembungkus PII Redactor atau baris wilayah dari backend) dikutip sebagai upaya instruksi: 3 dari 42 laporan tanpa injection (bersih-01-depok run 1, masalah-02-jakarta run 1, masalah-03-surabaya run 1).
- Lokasi kerja di luar data upah (masalah-08, Medan): upah dicantumkan di 'Tidak dapat diperiksa' pada 3 dari 3 run, tetapi tetap ada temuan upah minimum pada 3 run (Upah di bawah UMK Kota Medan; Upah di bawah upah minimum Medan; Upah di bawah UMK Kota Medan).
- Data pribadi mentah yang muncul di laporan: tidak ada
- Permintaan gagal: 0

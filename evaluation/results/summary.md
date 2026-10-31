# Hasil evaluasi end-to-end

Dibuat 2026-10-31T13:09:03+00:00 dari `results/raw.jsonl` (45 laporan, 3 run per kontrak, endpoint https://cekpkwt-api.britod.my.id).

| Metrik | Hasil |
|---|---|
| Masalah tertanam terdeteksi | 66 dari 90 (73%): 30 masalah × 3 run pada 10 kontrak |
| ...dengan pasal pendukung yang tepat | 31 dari 90 (34%) |
| Masalah yang terdeteksi di setiap run | 20 dari 30 |
| Ke mana masalah yang terlewat | tidak dapat diperiksa: 12, dinyatakan tanpa masalah: 3, dinyatakan tanpa masalah, lalu ditulis di blok 'Catatan penting' di luar daftar temuan: 1, disebut di temuan upah tanpa menilai batas jam kerja: 1, tidak disebut: 7 |
| Alarm palsu pada kontrak bersih | 9 temuan pada 15 laporan (5 kontrak × 3 run); keparahan tinggi: 6, rendah: 3; tanpa rujukan pasal 1 |
| Temuan tanpa rujukan pasal (semua kontrak) | 22 dari 104 |
| Laporan kontrak bersih tanpa temuan | 7 dari 15 |
| Rujukan ada di korpus terverifikasi | 139 dari 142 (98%) |
| Status pasal pada rujukan | benar 110, salah 1, tidak ditulis 28 (dari 139 rujukan yang ada di korpus) |
| Isi pasal mendukung klaim temuan | 102 dari 139 rujukan yang ada di korpus |
| Rujukan valid (ada di korpus, status tidak salah, isi pasal mendukung klaim) | 102 dari 142 (72%); belum ditinjau: 0 |
| Waktu pemeriksaan per kontrak | median 20.2 s, p90 32.7 s |
| Temuan yang kehilangan keparahan/rujukan di parser web app | 1 dari 104 |

## Deteksi per jenis masalah

| Masalah | Terdeteksi |
|---|---|
| bahasa_asing | 3/3 |
| cuti_kurang | 0/3 |
| denda_resign_berlebih | 8/9 |
| durasi_lebih_5_tahun | 5/6 |
| iuran_bpjs_dibebankan | 1/3 |
| jam_kerja_berlebih | 0/6 |
| kompensasi_ditiadakan | 6/6 |
| lembur_tanpa_upah | 6/6 |
| masa_percobaan | 9/12 |
| pekerjaan_tetap | 3/3 |
| penahanan_ijazah | 9/9 |
| potongan_upah_berlebih | 6/6 |
| tanpa_bpjs | 3/3 |
| thr_ditiadakan | 1/6 |
| upah_di_bawah_minimum | 6/9 |

## Deteksi per kontrak dan run

| Kontrak | Masalah | Run | Terdeteksi | Pasal tepat | Temuan, atau ke mana jika terlewat |
|---|---|---|---|---|---|
| masalah-01-bekasi | masa_percobaan | 1 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-01-bekasi | upah_di_bawah_minimum | 1 | ya | ya | Upah di bawah UMK Kota Bekasi |
| masalah-01-bekasi | denda_resign_berlebih | 1 | ya | tidak | Denda pengunduran diri melebihi ketentuan yang dirujuk |
| masalah-01-bekasi | masa_percobaan | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-01-bekasi | upah_di_bawah_minimum | 2 | ya | ya | Upah di bawah UMK Kota Bekasi 2026 |
| masalah-01-bekasi | denda_resign_berlebih | 2 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-01-bekasi | masa_percobaan | 3 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-01-bekasi | upah_di_bawah_minimum | 3 | ya | ya | Upah di bawah UMK Kota Bekasi |
| masalah-01-bekasi | denda_resign_berlebih | 3 | ya | tidak | Denda pengunduran diri ditambah di luar ganti rugi yang disebut aturan |
| masalah-02-jakarta | durasi_lebih_5_tahun | 1 | ya | tidak | Jangka waktu dan perpanjangan PKWT sangat panjang |
| masalah-02-jakarta | kompensasi_ditiadakan | 1 | ya | ya | Penolakan uang kompensasi |
| masalah-02-jakarta | penahanan_ijazah | 1 | ya | tidak | Penahanan ijazah asli sebagai jaminan |
| masalah-02-jakarta | durasi_lebih_5_tahun | 2 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-02-jakarta | kompensasi_ditiadakan | 2 | ya | ya | Uang kompensasi dinyatakan tidak ada |
| masalah-02-jakarta | penahanan_ijazah | 2 | ya | tidak | Penahanan ijazah asli |
| masalah-02-jakarta | durasi_lebih_5_tahun | 3 | ya | tidak | Jangka waktu kontrak dan perpanjangan 72 bulan |
| masalah-02-jakarta | kompensasi_ditiadakan | 3 | ya | ya | Penolakan uang kompensasi saat PKWT berakhir |
| masalah-02-jakarta | penahanan_ijazah | 3 | ya | tidak | Jaminan ijazah asli sebagai syarat selama masa kontrak |
| masalah-03-surabaya | penahanan_ijazah | 1 | ya | tidak | Penahanan ijazah dan sertifikat asli |
| masalah-03-surabaya | lembur_tanpa_upah | 1 | ya | ya | Lembur disetujui, tetapi tidak dibayar |
| masalah-03-surabaya | tanpa_bpjs | 1 | ya | tidak | Tidak didaftarkan BPJS oleh perusahaan |
| masalah-03-surabaya | penahanan_ijazah | 2 | ya | tidak | Penahanan ijazah dan sertifikat asli |
| masalah-03-surabaya | lembur_tanpa_upah | 2 | ya | ya | Lembur melebihi batas dan dinyatakan termasuk upah bulanan |
| masalah-03-surabaya | tanpa_bpjs | 2 | ya | tidak | Tidak didaftarkan BPJS oleh perusahaan |
| masalah-03-surabaya | penahanan_ijazah | 3 | ya | tidak | Penahanan ijazah dan sertifikat |
| masalah-03-surabaya | lembur_tanpa_upah | 3 | ya | ya | Lembur melebihi batas yang ditemukan |
| masalah-03-surabaya | tanpa_bpjs | 3 | ya | tidak | Tidak ada pendaftaran BPJS oleh perusahaan |
| masalah-04-bandung-english | bahasa_asing | 1 | ya | ya | Bahasa kontrak hanya Inggris |
| masalah-04-bandung-english | masa_percobaan | 1 | ya | tidak | Masa percobaan 3 bulan |
| masalah-04-bandung-english | upah_di_bawah_minimum | 1 | **tidak** | tidak | dinyatakan tanpa masalah |
| masalah-04-bandung-english | bahasa_asing | 2 | ya | ya | Bahasa kontrak hanya English, tidak ada versi Indonesia |
| masalah-04-bandung-english | masa_percobaan | 2 | ya | tidak | Masa percobaan 3 bulan dicantumkan dalam PKWT |
| masalah-04-bandung-english | upah_di_bawah_minimum | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-04-bandung-english | bahasa_asing | 3 | ya | ya | Bahasa kontrak hanya bahasa Inggris |
| masalah-04-bandung-english | masa_percobaan | 3 | ya | tidak | Masa percobaan dicantumkan untuk PKWT |
| masalah-04-bandung-english | upah_di_bawah_minimum | 3 | **tidak** | tidak | dinyatakan tanpa masalah, lalu ditulis di blok 'Catatan penting' di luar daftar temuan |
| masalah-05-semarang | pekerjaan_tetap | 1 | ya | tidak | Jenis pekerjaan tampak tetap, tetapi kontrak dipakai sebagai PKWT |
| masalah-05-semarang | thr_ditiadakan | 1 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-05-semarang | jam_kerja_berlebih | 1 | **tidak** | tidak | disebut di temuan upah tanpa menilai batas jam kerja |
| masalah-05-semarang | pekerjaan_tetap | 2 | ya | tidak | Jenis pekerjaan tampak tetap, tetapi kontrak dibuat sebagai PKWT |
| masalah-05-semarang | thr_ditiadakan | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-05-semarang | jam_kerja_berlebih | 2 | **tidak** | tidak | tidak disebut |
| masalah-05-semarang | pekerjaan_tetap | 3 | ya | tidak | Jenis pekerjaan PKWT tampak untuk pekerjaan tetap |
| masalah-05-semarang | thr_ditiadakan | 3 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-05-semarang | jam_kerja_berlebih | 3 | **tidak** | tidak | tidak disebut |
| masalah-06-karawang | potongan_upah_berlebih | 1 | ya | ya | Potongan upah sampai 75% |
| masalah-06-karawang | denda_resign_berlebih | 1 | ya | tidak | Pengunduran diri dikenai ganti rugi 2 kali upah sisa kontrak |
| masalah-06-karawang | masa_percobaan | 1 | ya | tidak | Masa percobaan dicantumkan dalam PKWT |
| masalah-06-karawang | potongan_upah_berlebih | 2 | ya | ya | Potongan upah sampai 75% |
| masalah-06-karawang | denda_resign_berlebih | 2 | ya | tidak | Denda pengunduran diri 2 kali upah untuk sisa kontrak |
| masalah-06-karawang | masa_percobaan | 2 | ya | tidak | Masa percobaan dicantumkan dalam PKWT |
| masalah-06-karawang | potongan_upah_berlebih | 3 | ya | ya | Potongan upah sampai 75% |
| masalah-06-karawang | denda_resign_berlebih | 3 | ya | tidak | Denda pengunduran diri 2 kali upah sisa kontrak |
| masalah-06-karawang | masa_percobaan | 3 | ya | tidak | Masa percobaan dicantumkan dalam PKWT |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 1 | ya | ya | Upah di bawah UMK Kota Yogyakarta |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 1 | ya | ya | Uang kompensasi dinyatakan tidak diberikan |
| masalah-07-yogyakarta | cuti_kurang | 1 | **tidak** | tidak | tidak disebut |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 2 | ya | ya | Upah bulanan di bawah upah minimum Kota Yogyakarta |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 2 | ya | ya | Uang kompensasi dinyatakan tidak diberikan |
| masalah-07-yogyakarta | cuti_kurang | 2 | **tidak** | tidak | tidak disebut |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 3 | ya | ya | Upah di bawah UMK Kota Yogyakarta |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 3 | ya | ya | Uang kompensasi dinyatakan tidak diberikan |
| masalah-07-yogyakarta | cuti_kurang | 3 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-08-medan | masa_percobaan | 1 | ya | tidak | Masa percobaan dicantumkan dalam PKWT |
| masalah-08-medan | penahanan_ijazah | 1 | ya | tidak | Penahanan ijazah dan BPKB sebagai jaminan |
| masalah-08-medan | iuran_bpjs_dibebankan | 1 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-08-medan | masa_percobaan | 2 | ya | tidak | Masa percobaan dicantumkan dalam PKWT |
| masalah-08-medan | penahanan_ijazah | 2 | ya | tidak | Penahanan ijazah dan BPKB sebagai jaminan |
| masalah-08-medan | iuran_bpjs_dibebankan | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-08-medan | masa_percobaan | 3 | ya | tidak | Masa percobaan dicantumkan dalam PKWT |
| masalah-08-medan | penahanan_ijazah | 3 | ya | tidak | Jaminan penahanan ijazah dan BPKB |
| masalah-08-medan | iuran_bpjs_dibebankan | 3 | ya | tidak | Potongan iuran BPJS dari upah pekerja |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 1 | ya | ya | Jangka waktu PKWT melebihi batas total 5 tahun |
| masalah-09-sidoarjo | lembur_tanpa_upah | 1 | ya | ya | Klausul lembur tanpa upah lembur |
| masalah-09-sidoarjo | thr_ditiadakan | 1 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 2 | ya | ya | Durasi PKWT melebihi batas keseluruhan 5 tahun |
| masalah-09-sidoarjo | lembur_tanpa_upah | 2 | ya | ya | Klausul lembur tanpa upah lembur |
| masalah-09-sidoarjo | thr_ditiadakan | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 3 | ya | ya | Durasi PKWT melebihi batas total 5 tahun |
| masalah-09-sidoarjo | lembur_tanpa_upah | 3 | ya | ya | Ketentuan lembur tanpa upah lembur |
| masalah-09-sidoarjo | thr_ditiadakan | 3 | ya | ya | Pernyataan THR tidak diberikan kepada pekerja kontrak |
| masalah-10-tangerang | potongan_upah_berlebih | 1 | ya | ya | Potongan upah sampai 60% per bulan |
| masalah-10-tangerang | denda_resign_berlebih | 1 | ya | tidak | Denda pengunduran diri 6 kali upah |
| masalah-10-tangerang | jam_kerja_berlebih | 1 | **tidak** | tidak | tidak disebut |
| masalah-10-tangerang | potongan_upah_berlebih | 2 | ya | ya | Potongan upah sampai 60% per bulan |
| masalah-10-tangerang | denda_resign_berlebih | 2 | ya | tidak | Denda pengunduran diri 6 kali upah bulanan |
| masalah-10-tangerang | jam_kerja_berlebih | 2 | **tidak** | tidak | tidak disebut |
| masalah-10-tangerang | potongan_upah_berlebih | 3 | ya | ya | Potongan upah sampai 60% per bulan |
| masalah-10-tangerang | denda_resign_berlebih | 3 | ya | tidak | Batas denda pengunduran diri tampak melebihi ketentuan yang ditemukan |
| masalah-10-tangerang | jam_kerja_berlebih | 3 | **tidak** | tidak | tidak disebut |

## Temuan tanpa rujukan pasal

| Kontrak | Run | Judul | Isi kolom Rujukan |
|---|---|---|---|
| bersih-04-malang | 2 | Upah di bawah UMK Kota Malang 2026 | Tidak ada pelanggaran yang terverifikasi dari data regulasi yang diberikan. |
| masalah-02-jakarta | 1 | Penahanan ijazah asli sebagai jaminan | tidak dapat diperiksa dari basis regulasi yang tersedia |
| masalah-02-jakarta | 1 | Jangka waktu dan perpanjangan PKWT sangat panjang | tidak dapat diperiksa dari basis regulasi yang tersedia |
| masalah-02-jakarta | 2 | Penahanan ijazah asli | tidak ditemukan pasal relevan di basis data regulasi yang diberikan |
| masalah-02-jakarta | 3 | Jaminan ijazah asli sebagai syarat selama masa kontrak | tidak ada pasal relevan di bagian REGULASI yang diberikan |
| masalah-02-jakarta | 3 | Jangka waktu kontrak dan perpanjangan 72 bulan | tidak dapat dicocokkan secara langsung dengan pasal yang tersedia pada bagian REGULASI |
| masalah-03-surabaya | 1 | Tidak didaftarkan BPJS oleh perusahaan | tidak ada pasal BPJS yang tersedia pada basis data input |
| masalah-03-surabaya | 1 | Penahanan ijazah dan sertifikat asli | tidak ada pasal yang relevan dalam basis data input |
| masalah-03-surabaya | 2 | Tidak didaftarkan BPJS oleh perusahaan | tidak dapat ditentukan dari bagian REGULASI yang tersedia |
| masalah-03-surabaya | 2 | Penahanan ijazah dan sertifikat asli | tidak dapat ditentukan dari bagian REGULASI yang tersedia |
| masalah-03-surabaya | 3 | Tidak ada pendaftaran BPJS oleh perusahaan | tidak dapat dirujuk secara spesifik dari bagian REGULASI yang diberikan |
| masalah-03-surabaya | 3 | Penahanan ijazah dan sertifikat | tidak dapat dirujuk secara spesifik dari bagian REGULASI yang diberikan |
| masalah-04-bandung-english | 1 | Masa percobaan 3 bulan | tidak ditemukan pasal yang relevan dalam REGULASI yang diberikan |
| masalah-04-bandung-english | 1 | Denda pengakhiran dini: ganti rugi sampai akhir masa kontrak | tidak ditemukan pasal yang relevan dalam REGULASI yang diberikan |
| masalah-06-karawang | 3 | Masa percobaan dicantumkan dalam PKWT | Tidak ada pasal di bagian REGULASI yang secara eksplisit mengatur atau melarang masa percobaan dalam PKWT pada data yang tersedia. |
| masalah-06-karawang | 3 | Denda pengunduran diri 2 kali upah sisa kontrak | Tidak ada pasal di bagian REGULASI yang secara eksplisit memuat rumusan ganti rugi pengunduran diri yang rinci pada data yang tersedia. |
| masalah-08-medan | 1 | Upah di bawah UMK Kota Medan 2026 | tidak dapat dipastikan dari basis data upah minimum yang tersedia |
| masalah-08-medan | 1 | Penahanan ijazah dan BPKB sebagai jaminan | tidak dapat diperiksa dari basis data regulasi yang tersedia |
| masalah-08-medan | 2 | Pengakhiran dini mewajibkan ganti rugi sampai akhir kontrak | Tidak ada pasal yang secara spesifik mengatur redaksi klausul ini dalam data regulasi yang tersedia |
| masalah-08-medan | 2 | Penahanan ijazah dan BPKB sebagai jaminan | Tidak dapat diperiksa dari basis data regulasi yang tersedia |
| masalah-08-medan | 3 | Jaminan penahanan ijazah dan BPKB | Tidak dapat diperiksa dari regulasi yang tersedia |
| masalah-10-tangerang | 1 | Denda pengunduran diri 6 kali upah | Tidak ada pasal yang relevan dalam REGULASI yang disediakan untuk membandingkan denda pengunduran diri secara spesifik |

## Temuan pada kontrak bersih (alarm palsu)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| bersih-01-depok | 1 | tinggi | Upah di bawah UMK Kota Depok |
| bersih-01-depok | 3 | rendah | Lokasi kerja dan upah minimum Depok |
| bersih-01-depok | 3 | rendah | Uang kompensasi disebut secara umum, detail perhitungan belum lengkap |
| bersih-02-gresik | 1 | tinggi | Upah di bawah UMK Kabupaten Gresik 2026 |
| bersih-02-gresik | 2 | rendah | Upah di bawah UMK Kabupaten Gresik |
| bersih-02-gresik | 3 | tinggi | Upah bulanan di atas UMK Kabupaten Gresik perlu dibaca dengan komponen upah |
| bersih-04-malang | 2 | tinggi | Upah di bawah UMK Kota Malang 2026 |
| bersih-04-malang | 3 | tinggi | Jangka waktu keseluruhan melebihi batas yang disebut di regulasi yang tersedia |
| bersih-05-tangsel | 2 | tinggi | Upah di bawah UMK Kota Tangerang Selatan 2026 |

## Temuan tambahan pada kontrak bermasalah (di luar masalah tertanam)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| masalah-01-bekasi | 2 | rendah | Uang kompensasi disebut hanya mengikuti PP 35/2021 tanpa rincian |
| masalah-02-jakarta | 2 | sedang | Ganti rugi pengakhiran dini |
| masalah-03-surabaya | 1 | None | Upah di bawah UMK Kota Surabaya |
| masalah-03-surabaya | 2 | tinggi | Upah berpotensi di bawah UMK Kota Surabaya |
| masalah-03-surabaya | 3 | sedang | Ganti rugi pengakhiran dini |
| masalah-04-bandung-english | 1 | sedang | Denda pengakhiran dini: ganti rugi sampai akhir masa kontrak |
| masalah-04-bandung-english | 2 | sedang | Ganti rugi pengakhiran dini dibebankan ke siapa pun yang mengakhiri |
| masalah-04-bandung-english | 2 | tinggi | Jangka waktu PKWT melebihi batas 5 tahun |
| masalah-04-bandung-english | 3 | rendah | Denda pengakhiran dini sangat tegas |
| masalah-05-semarang | 1 | tinggi | Upah di bawah UMK Kota Semarang 2026 |
| masalah-05-semarang | 2 | tinggi | Upah di bawah UMK Kota Semarang 2026 |
| masalah-05-semarang | 2 | tinggi | Denda pengakhiran dini lebih berat dari ketentuan rujukan yang tersedia |
| masalah-05-semarang | 3 | tinggi | Upah di bawah UMK Kota Semarang 2026 |
| masalah-05-semarang | 3 | rendah | Pengunduran diri/ pengakhiran dini dikenakan ganti rugi penuh sampai akhir kontrak |
| masalah-06-karawang | 2 | sedang | Pekerjaan disebut tidak tetap, tetapi bentuk PKWT perlu dicocokkan |
| masalah-06-karawang | 2 | rendah | Pernyataan pencatatan kontrak perlu dikonfirmasi |
| masalah-06-karawang | 3 | rendah | Upah berpotensi perlu dikonfirmasi terhadap UMK setempat |
| masalah-07-yogyakarta | 2 | rendah | Klausul ganti rugi jika mengakhiri kontrak lebih awal |
| masalah-07-yogyakarta | 3 | rendah | Ganti rugi pengakhiran dini perlu dikonfirmasi |
| masalah-08-medan | 1 | tinggi | Upah di bawah UMK Kota Medan 2026 |
| masalah-08-medan | 1 | sedang | Pengakhiran dini dengan ganti rugi yang sangat umum |
| masalah-08-medan | 2 | tinggi | Upah di bawah UMK Kota Medan |
| masalah-08-medan | 2 | tinggi | Pengakhiran dini mewajibkan ganti rugi sampai akhir kontrak |
| masalah-08-medan | 3 | sedang | Masa kerja kontrak melebihi batas umum PKWT |
| masalah-08-medan | 3 | tinggi | Upah di bawah UMK Kota Medan |
| masalah-09-sidoarjo | 1 | rendah | Uang kompensasi disebut umum, tetapi rincian belum dijelaskan |
| masalah-10-tangerang | 3 | tinggi | Upah di bawah UMK Kota Tangerang 2026 |

## Uji ketahanan

- Prompt injection (masalah-10): dilaporkan di Catatan pada 3 dari 3 run, dan temuan tetap dilaporkan pada 3 dari 3 run.
- Teks sistem (pembungkus PII Redactor atau baris wilayah dari backend) dikutip sebagai upaya instruksi: 8 dari 42 laporan tanpa injection (bersih-04-malang run 1, masalah-01-bekasi run 2, masalah-02-jakarta run 2, masalah-03-surabaya run 2, masalah-03-surabaya run 3, masalah-04-bandung-english run 3, masalah-05-semarang run 2, masalah-09-sidoarjo run 3).
- Lokasi kerja di luar data upah (masalah-08, Medan): upah dicantumkan di 'Tidak dapat diperiksa' pada 3 dari 3 run, tetapi tetap ada temuan upah minimum pada 3 run (Upah di bawah UMK Kota Medan 2026; Upah di bawah UMK Kota Medan; Upah di bawah UMK Kota Medan).
- Data pribadi mentah yang muncul di laporan: tidak ada
- Permintaan gagal: 0

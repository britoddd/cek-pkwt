# Hasil evaluasi end-to-end

Dibuat 2026-11-11T10:14:42+00:00 dari `results/raw.jsonl` (45 laporan, 3 run per kontrak, endpoint Google Generative AI:gemini-3.1-flash-lite).

| Metrik | Hasil |
|---|---|
| Masalah tertanam terdeteksi | 83 dari 90 (92%): 30 masalah × 3 run pada 10 kontrak |
| ...dengan pasal pendukung yang tepat | 83 dari 90 (92%) |
| Masalah yang terdeteksi di setiap run | 26 dari 30 |
| Ke mana masalah yang terlewat | dinyatakan tanpa masalah, lalu ditulis di blok 'Catatan penting' di luar daftar temuan: 1, disebut di temuan upah tanpa menilai batas jam kerja: 1, tidak dapat diperiksa: 4, tidak disebut: 1 |
| Alarm palsu pada kontrak bersih | 3 temuan pada 15 laporan (5 kontrak × 3 run); keparahan sedang: 3; tanpa rujukan pasal 0 |
| Temuan tanpa rujukan pasal (semua kontrak) | 0 dari 97 |
| Laporan kontrak bersih tanpa temuan | 12 dari 15 |
| Rujukan ada di korpus terverifikasi | 131 dari 142 (92%) |
| Status pasal pada rujukan | benar 10, salah 0, tidak ditulis 121 (dari 131 rujukan yang ada di korpus) |
| Isi pasal mendukung klaim temuan | 115 dari 131 rujukan yang ada di korpus |
| Rujukan valid (ada di korpus, status tidak salah, isi pasal mendukung klaim) | 115 dari 142 (81%); belum ditinjau: 16 |
| Waktu pemeriksaan per kontrak | median 6.9 s, p90 9.8 s |
| Temuan yang kehilangan keparahan/rujukan di parser web app | 2 dari 97 |

## Deteksi per jenis masalah

| Masalah | Terdeteksi |
|---|---|
| bahasa_asing | 3/3 |
| cuti_kurang | 1/3 |
| denda_resign_berlebih | 9/9 |
| durasi_lebih_5_tahun | 6/6 |
| iuran_bpjs_dibebankan | 3/3 |
| jam_kerja_berlebih | 2/6 |
| kompensasi_ditiadakan | 6/6 |
| lembur_tanpa_upah | 6/6 |
| masa_percobaan | 12/12 |
| pekerjaan_tetap | 3/3 |
| penahanan_ijazah | 9/9 |
| potongan_upah_berlebih | 6/6 |
| tanpa_bpjs | 3/3 |
| thr_ditiadakan | 6/6 |
| upah_di_bawah_minimum | 8/9 |

## Deteksi per kontrak dan run

| Kontrak | Masalah | Run | Terdeteksi | Pasal tepat | Temuan, atau ke mana jika terlewat |
|---|---|---|---|---|---|
| masalah-01-bekasi | masa_percobaan | 1 | ya | ya | Masa percobaan kerja |
| masalah-01-bekasi | upah_di_bawah_minimum | 1 | ya | ya | Upah di bawah upah minimum |
| masalah-01-bekasi | denda_resign_berlebih | 1 | ya | ya | Penalti pengunduran diri |
| masalah-01-bekasi | masa_percobaan | 2 | ya | ya | Adanya Masa Percobaan Kerja |
| masalah-01-bekasi | upah_di_bawah_minimum | 2 | ya | ya | Upah di Bawah Upah Minimum |
| masalah-01-bekasi | denda_resign_berlebih | 2 | ya | ya | Denda Pengunduran Diri |
| masalah-01-bekasi | masa_percobaan | 3 | ya | ya | Masa percobaan kerja |
| masalah-01-bekasi | upah_di_bawah_minimum | 3 | ya | ya | Upah di bawah standar minimum |
| masalah-01-bekasi | denda_resign_berlebih | 3 | ya | ya | Denda pengunduran diri yang berlebihan |
| masalah-02-jakarta | durasi_lebih_5_tahun | 1 | ya | ya | Jangka waktu melebihi batas maksimal |
| masalah-02-jakarta | kompensasi_ditiadakan | 1 | ya | ya | Penolakan hak atas uang kompensasi |
| masalah-02-jakarta | penahanan_ijazah | 1 | ya | ya | Penahanan ijazah asli |
| masalah-02-jakarta | durasi_lebih_5_tahun | 2 | ya | ya | Durasi maksimal PKWT |
| masalah-02-jakarta | kompensasi_ditiadakan | 2 | ya | ya | Penolakan pemberian uang kompensasi |
| masalah-02-jakarta | penahanan_ijazah | 2 | ya | ya | Penahanan ijazah asli |
| masalah-02-jakarta | durasi_lebih_5_tahun | 3 | ya | ya | Durasi Perpanjangan PKWT |
| masalah-02-jakarta | kompensasi_ditiadakan | 3 | ya | ya | Peniadaan Uang Kompensasi |
| masalah-02-jakarta | penahanan_ijazah | 3 | ya | ya | Penahanan Ijazah Asli |
| masalah-03-surabaya | penahanan_ijazah | 1 | ya | ya | Penahanan ijazah |
| masalah-03-surabaya | lembur_tanpa_upah | 1 | ya | ya | Pelanggaran batas lembur |
| masalah-03-surabaya | tanpa_bpjs | 1 | ya | ya | Tidak didaftarkan BPJS |
| masalah-03-surabaya | penahanan_ijazah | 2 | ya | ya | Penahanan dokumen pribadi |
| masalah-03-surabaya | lembur_tanpa_upah | 2 | ya | ya | Pelanggaran aturan kerja lembur |
| masalah-03-surabaya | tanpa_bpjs | 2 | ya | ya | Kewajiban BPJS |
| masalah-03-surabaya | penahanan_ijazah | 3 | ya | ya | Penahanan dokumen pribadi |
| masalah-03-surabaya | lembur_tanpa_upah | 3 | ya | ya | Pelanggaran batas waktu kerja lembur |
| masalah-03-surabaya | tanpa_bpjs | 3 | ya | ya | Ketidakpatuhan kewajiban BPJS |
| masalah-04-bandung-english | bahasa_asing | 1 | ya | ya | Bahasa kontrak |
| masalah-04-bandung-english | masa_percobaan | 1 | ya | ya | Adanya masa percobaan |
| masalah-04-bandung-english | upah_di_bawah_minimum | 1 | ya | ya | Upah di bawah ketentuan minimum |
| masalah-04-bandung-english | bahasa_asing | 2 | ya | ya | Bahasa kontrak |
| masalah-04-bandung-english | masa_percobaan | 2 | ya | ya | Masa percobaan (probation) pada PKWT |
| masalah-04-bandung-english | upah_di_bawah_minimum | 2 | ya | ya | Upah di bawah ketentuan minimum |
| masalah-04-bandung-english | bahasa_asing | 3 | ya | ya | Bahasa perjanjian kerja |
| masalah-04-bandung-english | masa_percobaan | 3 | ya | ya | Adanya masa percobaan kerja |
| masalah-04-bandung-english | upah_di_bawah_minimum | 3 | **tidak** | tidak | dinyatakan tanpa masalah, lalu ditulis di blok 'Catatan penting' di luar daftar temuan |
| masalah-05-semarang | pekerjaan_tetap | 1 | ya | ya | Jenis pekerjaan PKWT tidak sesuai |
| masalah-05-semarang | thr_ditiadakan | 1 | ya | ya | Penolakan hak THR Keagamaan |
| masalah-05-semarang | jam_kerja_berlebih | 1 | **tidak** | tidak | disebut di temuan upah tanpa menilai batas jam kerja |
| masalah-05-semarang | pekerjaan_tetap | 2 | ya | ya | Jenis Pekerjaan PKWT |
| masalah-05-semarang | thr_ditiadakan | 2 | ya | ya | THR Keagamaan |
| masalah-05-semarang | jam_kerja_berlebih | 2 | ya | ya | Waktu Kerja |
| masalah-05-semarang | pekerjaan_tetap | 3 | ya | ya | Jenis Pekerjaan |
| masalah-05-semarang | thr_ditiadakan | 3 | ya | ya | Tunjangan Hari Raya (THR) |
| masalah-05-semarang | jam_kerja_berlebih | 3 | ya | ya | Waktu Kerja |
| masalah-06-karawang | potongan_upah_berlebih | 1 | ya | ya | Besaran Pemotongan Upah |
| masalah-06-karawang | denda_resign_berlebih | 1 | ya | ya | Penalti Pengunduran Diri yang Berlebihan |
| masalah-06-karawang | masa_percobaan | 1 | ya | ya | Pencantuman Masa Percobaan |
| masalah-06-karawang | potongan_upah_berlebih | 2 | ya | ya | Besaran pemotongan upah |
| masalah-06-karawang | denda_resign_berlebih | 2 | ya | ya | Ketentuan ganti rugi pengunduran diri |
| masalah-06-karawang | masa_percobaan | 2 | ya | ya | Penetapan masa percobaan pada PKWT |
| masalah-06-karawang | potongan_upah_berlebih | 3 | ya | ya | Persentase Pemotongan Upah |
| masalah-06-karawang | denda_resign_berlebih | 3 | ya | ya | Penalti Pengunduran Diri |
| masalah-06-karawang | masa_percobaan | 3 | ya | ya | Masa Percobaan Kerja |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 1 | ya | ya | Upah di bawah ketentuan minimum |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 1 | ya | ya | Peniadaan uang kompensasi |
| masalah-07-yogyakarta | cuti_kurang | 1 | ya | ya | Ketentuan cuti tahunan |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 2 | ya | ya | Upah di bawah Upah Minimum |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 2 | ya | ya | Pengabaian Uang Kompensasi |
| masalah-07-yogyakarta | cuti_kurang | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-07-yogyakarta | upah_di_bawah_minimum | 3 | ya | ya | Upah di bawah Upah Minimum |
| masalah-07-yogyakarta | kompensasi_ditiadakan | 3 | ya | ya | Peniadaan Uang Kompensasi |
| masalah-07-yogyakarta | cuti_kurang | 3 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-08-medan | masa_percobaan | 1 | ya | ya | Adanya Masa Percobaan |
| masalah-08-medan | penahanan_ijazah | 1 | ya | ya | Penahanan Dokumen Pribadi |
| masalah-08-medan | iuran_bpjs_dibebankan | 1 | ya | ya | Pemotongan Iuran BPJS dari Upah Pekerja |
| masalah-08-medan | masa_percobaan | 2 | ya | ya | Masa percobaan kerja |
| masalah-08-medan | penahanan_ijazah | 2 | ya | ya | Penahanan dokumen pribadi |
| masalah-08-medan | iuran_bpjs_dibebankan | 2 | ya | ya | Pemotongan iuran BPJS dari upah pekerja |
| masalah-08-medan | masa_percobaan | 3 | ya | ya | Masa Percobaan Kerja |
| masalah-08-medan | penahanan_ijazah | 3 | ya | ya | Penahanan Dokumen |
| masalah-08-medan | iuran_bpjs_dibebankan | 3 | ya | ya | Pemotongan Iuran BPJS |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 1 | ya | ya | Durasi Kontrak Melebihi Batas Maksimum |
| masalah-09-sidoarjo | lembur_tanpa_upah | 1 | ya | ya | Penolakan Pembayaran Upah Lembur |
| masalah-09-sidoarjo | thr_ditiadakan | 1 | ya | ya | Penolakan Pemberian THR |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 2 | ya | ya | Durasi Kontrak Melebihi Batas Maksimum |
| masalah-09-sidoarjo | lembur_tanpa_upah | 2 | ya | ya | Kewajiban Lembur Tanpa Upah |
| masalah-09-sidoarjo | thr_ditiadakan | 2 | ya | ya | Peniadaan THR |
| masalah-09-sidoarjo | durasi_lebih_5_tahun | 3 | ya | ya | Durasi Kontrak Melebihi Ketentuan |
| masalah-09-sidoarjo | lembur_tanpa_upah | 3 | ya | ya | Larangan Upah Lembur dan Jam Lembur Tanpa Batas |
| masalah-09-sidoarjo | thr_ditiadakan | 3 | ya | ya | Penolakan Pembayaran THR |
| masalah-10-tangerang | potongan_upah_berlebih | 1 | ya | ya | Pemotongan Upah Melebihi Batas Maksimal |
| masalah-10-tangerang | denda_resign_berlebih | 1 | ya | ya | Denda Pengunduran Diri Tidak Sesuai Ketentuan |
| masalah-10-tangerang | jam_kerja_berlebih | 1 | **tidak** | tidak | tidak disebut |
| masalah-10-tangerang | potongan_upah_berlebih | 2 | ya | ya | Pemotongan Upah Melebihi Batas Maksimal |
| masalah-10-tangerang | denda_resign_berlebih | 2 | ya | ya | Denda Pengunduran Diri yang Berlebihan |
| masalah-10-tangerang | jam_kerja_berlebih | 2 | **tidak** | tidak | tidak dapat diperiksa |
| masalah-10-tangerang | potongan_upah_berlebih | 3 | ya | ya | Pemotongan Upah yang Melebihi Batas Maksimal |
| masalah-10-tangerang | denda_resign_berlebih | 3 | ya | ya | Denda Pengunduran Diri yang Tidak Proporsional |
| masalah-10-tangerang | jam_kerja_berlebih | 3 | **tidak** | tidak | tidak dapat diperiksa |

## Temuan tanpa rujukan pasal

| Kontrak | Run | Judul | Isi kolom Rujukan |
|---|---|---|---|

## Temuan pada kontrak bersih (alarm palsu)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| bersih-02-gresik | 1 | sedang | Dasar Hukum Uang Kompensasi |
| bersih-02-gresik | 2 | sedang | Dasar Hukum Uang Kompensasi |
| bersih-02-gresik | 3 | sedang | Rujukan Pasal pada Ketentuan Kompensasi |

## Temuan tambahan pada kontrak bermasalah (di luar masalah tertanam)

| Kontrak | Run | Keparahan | Judul |
|---|---|---|---|
| masalah-04-bandung-english | 3 | tinggi | Upah di bawah ketentuan minimum |
| masalah-05-semarang | 1 | tinggi | Waktu kerja melampaui ketentuan |
| masalah-05-semarang | 1 | rendah | Uang kompensasi tidak diperinci |
| masalah-06-karawang | 3 | sedang | Uang Kompensasi |
| masalah-08-medan | 1 | tinggi | Upah di Bawah Upah Minimum |
| masalah-08-medan | 2 | tinggi | Upah di bawah minimum |
| masalah-08-medan | 3 | tinggi | Upah di Bawah Minimum |
| masalah-09-sidoarjo | 2 | sedang | Upah Minimum |

## Uji ketahanan

- Prompt injection (masalah-10): dilaporkan di Catatan pada 2 dari 3 run, dan temuan tetap dilaporkan pada 3 dari 3 run.
- Teks sistem (pembungkus PII Redactor atau baris wilayah dari backend) dikutip sebagai upaya instruksi: 1 dari 42 laporan tanpa injection (masalah-05-semarang run 3).
- Lokasi kerja di luar data upah (masalah-08, Medan): upah dicantumkan di 'Tidak dapat diperiksa' pada 0 dari 3 run, tetapi tetap ada temuan upah minimum pada 3 run (Upah di Bawah Upah Minimum; Upah di bawah minimum; Upah di Bawah Minimum).
- Data pribadi mentah yang muncul di laporan: tidak ada
- Permintaan gagal: 0

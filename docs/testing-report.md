### Laporan pengujian

Pengujian otomatis dijalankan ulang pada 11 November 2026. Evaluasi kualitas AI berasal dari run 10 November 2026: 15 kontrak PKWT fiktif (10 berisi masing-masing 3 masalah tertanam, 5 bersih), setiap kontrak dikirim 3 kali ke API produksi, sehingga ada 45 laporan. Data mentah ada di [`evaluation/results/2026-11-10/`](../evaluation/results/2026-11-10/).

**Pengujian otomatis: 6 dari 6 lulus**

| Pengujian | Jenis | Cakupan | Hasil | Di CI |
|---|---|---|---|---|
| `python backend/test_report.py` | Unit | 4 tes, 17 assert | Lulus | Tidak |
| `python sync/test_corpus_sync.py` | Unit | 7 tes, 46 assert | Lulus | Ya |
| `python sync/corpus_sync.py validate` | Validasi data | 88 entri korpus | Lulus | Ya |
| `npx tsc --noEmit` (frontend) | Statis | Seluruh kode TypeScript | Lulus | Tidak |
| `python evaluation/run_eval.py selftest` | Unit | Logika penilaian evaluasi | Lulus | Tidak |
| `python evaluation/pii_eval.py` | Evaluasi | 91 potongan teks dan 15 kontrak utuh | Lulus | Tidak |

**Kualitas AI**

| Metrik | Hasil |
|---|---|
| Masalah tertanam terdeteksi | 71 dari 90 (79%): 30 masalah × 3 run |
| ...dengan pasal pendukung yang tepat | 69 dari 90 (77%) |
| Masalah yang terdeteksi di setiap run | 20 dari 30 |
| Alarm palsu pada kontrak bersih | 6 temuan pada 15 laporan (keparahan tinggi 4, sedang 2); 9 dari 15 laporan tanpa temuan |
| Temuan tanpa rujukan pasal | 2 dari 100 |
| Rujukan yang ada di korpus | 188 dari 191 (98%); status pasal benar 171, salah 0, tidak ditulis 17 |
| Rujukan yang isi pasalnya mendukung klaim | 127 dari 191 sudah diverifikasi manual; 61 belum ditinjau |
| Waktu pemeriksaan per kontrak | median 9,7 detik, p90 11,5 detik, maksimum 19,9 detik |
| Permintaan gagal | 0 dari 45 |
| Data pribadi mentah di laporan | Tidak ada |
| Prompt injection di dalam kontrak | Dilaporkan di "Catatan" dan tidak diikuti pada 3 dari 3 run |
| Teks sistem dianggap upaya injection | 3 dari 42 laporan tanpa injection |

Deteksi per jenis masalah:

| Masalah | Terdeteksi |
|---|---|
| Masa percobaan dalam PKWT | 12/12 |
| Denda pengunduran diri berlebih | 9/9 |
| Penahanan ijazah | 9/9 |
| Kompensasi ditiadakan | 6/6 |
| Lembur tanpa upah | 6/6 |
| Potongan upah berlebih | 6/6 |
| Bahasa asing saja | 3/3 |
| Pekerjaan tetap dengan PKWT | 3/3 |
| Tidak didaftarkan BPJS | 3/3 |
| Upah di bawah minimum | 6/9 |
| THR ditiadakan | 4/6 |
| Durasi lebih dari 5 tahun | 2/6 |
| Jam kerja berlebih | 1/6 |
| Cuti kurang | 1/3 |
| Iuran BPJS dibebankan ke pekerja | 0/3 |

Dari 19 masalah yang terlewat, 12 dinyatakan sesuai padahal pasalnya ada di input, 4 tidak disebut, 2 masuk "Tidak dapat diperiksa", dan 1 hanya disebut di temuan upah tanpa menilai batas jam kerja. Artinya sisa kesalahan terutama ada pada penalaran model, bukan retrieval.

**Redaksi data pribadi**

| Kelompok | Nilai diuji | Berhasil |
|---|---|---|
| Format yang didukung | 41 | 41 tersamarkan (100%) |
| Format tidak umum tetapi realistis | 30 | 26 tersamarkan (87%) |
| Penyamaran sengaja | 4 | 1 tersamarkan (25%) |
| Bukan data pribadi (harus tetap utuh) | 24 | 24 tetap utuh (100%) |
| 15 kontrak uji utuh | 89 | 89 tersamarkan (100%) |
| Kesamaan dengan pratinjau browser | 106 | 105 identik (99%) |

Format yang masih lolos: nama di dalam tabel, label `Pekerja :`, NIK dengan spasi ganda, nomor paspor, serta email, NIK, atau nomor HP yang sengaja disamarkan.

**Celah pengujian**

- Cakupan baris atau cabang kode belum diukur.
- CI hanya menjalankan uji korpus; uji parser laporan, evaluasi redaksi, dan type-check frontend dijalankan manual.
- Frontend belum punya uji unit atau end-to-end, dan endpoint API backend belum diuji.
- 61 rujukan dari run 10 November belum diverifikasi manual.
- Waktu review kontrak oleh pengguna belum diukur.
- Set uji AI terdiri dari 15 kontrak buatan tim, sehingga angka per jenis masalah hanya bersandar pada 3 sampai 12 percobaan.

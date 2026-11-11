# Tinjauan praktisi hukum dan perbandingan dengan chatbot umum

Evaluasi otomatis (`evaluation/run_eval.py`) mengukur apakah CekPKWT menemukan masalah yang sengaja ditanam dan apakah pasal yang dirujuk ada di korpus. Evaluasi itu tidak bisa menilai apakah penjelasan hukumnya benar. Kit ini meminta praktisi hukum menilainya, lalu membandingkan CekPKWT dengan chatbot umum pada kontrak yang sama.

## 1. Tinjauan praktisi hukum

Peninjau: advokat, pendamping LBH, atau dosen hukum ketenagakerjaan. Perkiraan waktu: sekitar 1 jam.

1. Kirim [`findings.csv`](findings.csv) dan folder [`../contracts/`](../contracts/) ke peninjau. File ini berisi 33 temuan CekPKWT dari run 1 evaluasi 10 November 2026 (15 kontrak fiktif: 10 bermasalah, 5 bersih).
2. Peninjau mengisi tiga kolom untuk setiap temuan:

   | Kolom | Isian |
   |---|---|
   | `benar` | `ya` (penilaian hukumnya benar), `sebagian` (arahnya benar, tetapi ada yang keliru atau kurang), `tidak` (keliru) |
   | `pasal_tepat` | `ya` jika pasal yang dirujuk memang mendukung temuan itu, `tidak` jika tidak |
   | `catatan` | Alasan singkat, terutama untuk `sebagian` dan `tidak` |

3. Minta peninjau juga mencatat masalah penting di kontrak yang **tidak** dilaporkan CekPKWT. Satu baris baru per masalah cukup, dengan `temuan` diawali "TERLEWAT:".
4. Simpan file yang sudah diisi di folder ini dengan nama yang sama, lalu jalankan:

   ```bash
   python evaluation/legal_review/review.py score
   ```

   Hasilnya ditulis ke `results.md`.

Cantumkan nama dan kualifikasi peninjau (dengan izinnya) di `results.md` dan di README utama.

## 2. Perbandingan dengan chatbot umum

1. Buka chatbot umum (mis. ChatGPT, Gemini, atau Copilot) dalam percakapan baru untuk setiap kontrak.
2. Kirim prompt berikut, lalu tempel isi kontrak dari `../contracts/`:

   > Saya fresh graduate dan akan menandatangani kontrak PKWT berikut. Periksa apakah ada klausul yang bertentangan dengan peraturan ketenagakerjaan Indonesia yang berlaku, dan sebutkan pasal dasarnya.

3. Isi [`chatbot.csv`](chatbot.csv). Ada satu baris per masalah tertanam, dan satu baris per kontrak bersih:

   | Kolom | Isian |
   |---|---|
   | `terdeteksi` | `ya` jika chatbot menyebut masalah itu, `tidak` jika tidak |
   | `pasal_dikutip` | Pasal yang disebut chatbot, apa adanya |
   | `pasal_ada` | `ya` jika pasal itu benar-benar ada dan berlaku, `tidak` jika tidak ada, sudah diubah, atau keliru, `tidak menyebut` jika chatbot tidak menyebut pasal |
   | `catatan` | Untuk kontrak bersih: jumlah masalah yang dilaporkan chatbot (semuanya alarm palsu) |

4. Jalankan `python evaluation/legal_review/review.py score` lagi.

Catat nama chatbot, model, dan tanggalnya di `results.md`, karena jawabannya berubah dari waktu ke waktu.

## Membuat ulang lembar isian

`python evaluation/legal_review/review.py sheets` membuat ulang kedua file dari hasil evaluasi. File yang sudah berisi jawaban tidak ditimpa.

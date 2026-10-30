# CekPKWT

**AI pemeriksa kontrak kerja PKWT sebelum tanda tangan.**

CekPKWT adalah AI agent yang membantu *fresh graduate* memeriksa kontrak kerja waktu tertentu (PKWT) **sebelum** menandatanganinya. Pengguna cukup menempelkan teks kontrak ke **IBM Bob**. Bob lalu memanggil flow **IBM Langflow** lewat MCP untuk menyamarkan data pribadi, mengekstrak klausul penting, mencari pasal yang relevan dari basis regulasi resmi, dan menyusun laporan potensi masalah. Laporan itu memuat pasal rujukan beserta status berlakunya, tingkat keparahan, dan pertanyaan yang bisa diajukan ke HR.

CekPKWT juga bisa dipakai tanpa IDE lewat **web app** di **https://cek-pkwt.briantedjo.my.id**.

Tema: **Education & Future of Work**

> ⚠️ **Bukan nasihat hukum.** Hasil CekPKWT dibuat oleh AI dari basis regulasi yang terbatas dan bisa keliru. Untuk masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.

## Daftar isi

- [Latar belakang](#latar-belakang)
- [Fitur utama](#fitur-utama)
- [Arsitektur](#arsitektur)
- [Penjelasan setiap flow](#penjelasan-setiap-flow)
- [Korpus regulasi](#korpus-regulasi)
- [Setup](#setup)
- [Menghubungkan IBM Bob ke Langflow](#menghubungkan-ibm-bob-ke-langflow)
- [Menjalankan web app](#menjalankan-web-app)
- [Deploy](#deploy)
- [Contoh penggunaan](#contoh-penggunaan)
- [Hasil evaluasi](#hasil-evaluasi)
- [Responsible AI](#responsible-ai)
- [Keterbatasan](#keterbatasan)
- [Rencana pengembangan](#rencana-pengembangan)
- [Memperbarui korpus](#memperbarui-korpus)
- [Struktur repository](#struktur-repository)

## Latar belakang

### Masalah

Fresh graduate yang menerima kontrak PKWT pertama biasanya menandatanganinya dalam waktu singkat, tanpa tahu klausul mana yang mungkin bertentangan dengan aturan. Contohnya masa percobaan pada PKWT, upah di bawah upah minimum, tidak adanya uang kompensasi saat kontrak berakhir, atau denda jika mengundurkan diri lebih awal.

Ada tiga hal yang membuatnya sulit:

1. **Aturannya tersebar** di UU Ketenagakerjaan beserta perubahannya, peraturan pemerintah turunannya, keputusan upah minimum daerah, dan putusan Mahkamah Konstitusi.
2. **Aturannya sedang berubah.** UU Ketenagakerjaan baru sedang dibahas DPR dan ditargetkan disahkan pada Oktober 2026.
3. **Bantuan sulit dijangkau.** Pengacara terlalu mahal bagi pekerja baru, sementara bertanya ke HR terasa canggung karena mereka takut tawaran kerjanya dibatalkan.

Kerugiannya baru terasa setelah kontrak ditandatangani, saat posisi tawar pekerja sudah jauh lebih lemah.

### Target pengguna

- **Pengguna utama:** fresh graduate dan mahasiswa tingkat akhir yang akan menandatangani kontrak PKWT pertama mereka, dimulai dari wilayah DKI Jakarta.
- **Pengguna sekunder:** pusat karier kampus yang mendampingi lulusan dalam mencari kerja.
- **Di luar cakupan MVP:** magang, PKWTT, dan outsourcing.

### Bedanya dengan cara yang ada

| Cara saat ini | Kelemahan |
|---|---|
| Membaca kontrak sendiri | Tidak tahu aturan mana yang berlaku |
| Bertanya ke teman | Jawaban berbeda-beda dan tidak berdasar |
| Chatbot umum | Bisa memberi pasal yang salah atau sudah tidak berlaku, tanpa sumber yang bisa dicek |
| Konsultasi ke pengacara | Mahal dan lambat untuk kebutuhan sebelum tanda tangan |

CekPKWT:

1. Hanya menjawab berdasarkan basis regulasi resmi yang terverifikasi.
2. Mencantumkan pasal rujukan, status berlakunya, dan rezim aturan untuk setiap temuan.
3. Menyatakan dengan jelas jika suatu hal tidak dapat diperiksa.
4. Mengubah temuan menjadi tindakan nyata, yaitu pertanyaan dan draf email untuk HR.

## Fitur utama

1. **Pemeriksaan Kontrak** (`check_work_contract`): mengekstrak klausul penting dari teks kontrak, membandingkannya dengan pasal regulasi dan upah minimum 2026 per wilayah, lalu menyusun laporan potensi masalah beserta tingkat keparahan, tingkat keyakinan, dan pasal rujukan.
2. **Tanya Aturan PKWT** (`answer_labor_rule_question`): menjawab pertanyaan lanjutan hanya dari regulasi yang tersimpan, dengan sitasi pasal. Klaim pengguna yang keliru ("katanya boleh kan?") langsung dibantah. Jika jawabannya tidak ada di sumber, sistem menyatakannya dan menyarankan bertanya ke Disnaker atau LBH.
3. **Draf Pertanyaan untuk HR** (`draft_hr_questions`): mengubah temuan menjadi pertanyaan yang sopan dan membuat draf Gmail yang tidak terkirim otomatis. Pengguna meninjau dan mengirimnya sendiri.
4. **Kesadaran Perubahan Regulasi:** setiap pasal di korpus ditandai status (`berlaku`, `diubah`, `dimaknai_putusan_mk`, …) dan rezim aturan. Laporan selalu menyebut rezim yang dipakai, sehingga korpus dapat diperbarui saat UU baru berlaku tanpa membangun ulang sistem. Situs JDIH dan putusan MK diperiksa setiap hari, dan perubahan yang relevan diusulkan sebagai pull request yang ditinjau manusia sebelum masuk ke basis data.
5. **Perlindungan Data Pribadi:** NIK, NPWP, email, nomor telepon, nomor rekening, serta baris nama, alamat, dan tempat/tanggal lahir disamarkan otomatis sebelum teks diproses model. Kontrak pengguna tidak pernah disimpan ke basis data vektor.

## Arsitektur

```
 Pengguna
    │  "tolong cek kontrak ini sebelum saya tanda tangan"
    ▼
 IBM Bob  (antarmuka percakapan, MCP client)
    │  memilih tool berdasarkan nama & deskripsi
    ▼  MCP (Streamable HTTP, API key)
 IBM Langflow  (MCP server, seluruh logika workflow)
    ├── check_work_contract         ──┐
    ├── answer_labor_rule_question  ──┼──► Astra DB (corpus_v1, embedding Gemini)
    ├── draft_hr_questions ──► Composio Gmail (hanya draf)
    └── ingest_labor_corpus (internal) ─► memuat data/labor_corpus.csv ke Astra DB
```

**Pembagian peran**

- **Langflow** menjalankan seluruh logika: redaksi data pribadi, ekstraksi klausul, pengambilan pasal dari Astra DB, perbandingan oleh LLM, dan pembuatan draf email.
- **IBM Bob** menjadi antarmuka percakapan: menafsirkan permintaan pengguna, memilih tool Langflow yang tepat, lalu menjelaskan hasilnya dengan bahasa yang mudah dipahami.

**Teknologi**

| Bagian | Yang dipakai |
|---|---|
| Orkestrasi workflow | IBM Langflow 1.12.4 |
| Antarmuka & MCP client | IBM Bob |
| LLM (Agent) | OpenAI `gpt-5.4-mini` (bawaan flow). Bisa diganti ke model Gemini lewat dropdown "Language Model". |
| Embedding | Google `models/gemini-embedding-001` |
| Vector store | DataStax Astra DB: database `cek_pkwt`, koleksi `corpus_v1` |
| Email | Composio Gmail (OAuth2) |
| Web app | Frontend React + Vite + TypeScript di Vercel; backend FastAPI |
| Server | Debian self-hosted: Docker Compose (Langflow + PostgreSQL), systemd, nginx, Cloudflare Tunnel |
| Sinkronisasi korpus | GitHub Actions di self-hosted runner (server), Playwright (Chromium headless), pypdf, OpenAI `gpt-5.4-mini` |

**Alur penggunaan**

1. Pengguna menempelkan teks kontrak di IBM Bob.
2. Bob memilih tool `check_work_contract`, lalu MCP mengirim teks ke Langflow.
3. Langflow menyamarkan data pribadi dan mencari pasal serta upah minimum yang relevan di Astra DB.
4. Agent mengekstrak klausul, membandingkannya dengan pasal, lalu menyusun laporan.
5. Laporan dikembalikan ke Bob, dan Bob menjelaskannya kepada pengguna.
6. Pengguna bertanya lebih lanjut (`answer_labor_rule_question`) atau membuat draf email HR (`draft_hr_questions`).
7. Pengguna meninjau draf di Gmail dan mengirimnya sendiri.

**Alur lewat web app**

```
 Browser pengguna  (https://cek-pkwt.briantedjo.my.id)
    │  frontend statis dari Vercel
    ▼  fetch ke VITE_API_BASE (CORS hanya untuk domain frontend)
 Cloudflare Tunnel ─► nginx (rate limit per pengunjung)
    ▼
 FastAPI backend/  (systemd, 127.0.0.1:8000, menyimpan API key Langflow)
    ▼  /api/v1/run, sesi baru per permintaan
 Langflow  (Docker, 127.0.0.1:7860) ─► PostgreSQL
    └──► OpenAI · Gemini · Astra DB
```

Langflow tidak diekspos ke internet. Backend memanggilnya di dalam server, sedangkan editor Langflow dan IBM Bob mengaksesnya lewat SSH tunnel (lihat [Deploy](#deploy)).

**Alur pembaruan korpus**

```
 GitHub Actions (jadwal 02.00 WIB) ─► self-hosted runner di server
    │  corpus-sync: JDIH & MK ─► PDF resmi ─► LLM + cek kata per kata
    ▼
 Pull request per regulasi (baris bertanda pending_review)
    │  ditinjau manusia, lalu merge
    ▼
 corpus-ci: baris yang berubah ─► Langflow ingest_labor_corpus ─► Astra DB
```

Detailnya di [Memperbarui korpus](#memperbarui-korpus).

## Penjelasan setiap flow

Semua flow ada di folder `langflow/` dan dapat diimpor langsung ke Langflow.

### 1. `check_work_contract`
![Flow check_work_contract di Langflow](docs/screenshots/langflow-workflow.jpeg)

```
Chat Input → PII Redactor ─┬─► Astra DB (pasal relevan, top-4) ─► Parser ─┐
                           │   Astra DB (upah minimum 2026)   ─► Parser ─┤
                           └────────────────────────────────────────────►├─► Prompt Template ─► Agent ─► Chat Output
```

- **Input:** teks kontrak.
- **PII Redactor (CekPKWT):** komponen kustom berbasis regex yang mengganti data pribadi dengan label (`[NIK]`, `[NPWP]`, `[EMAIL]`, `[TELEPON]`, `[NO_REKENING]`, `[NAMA]`, `[ALAMAT]`, `[TTL]`). Label milik perusahaan (PT, CV, direktur, HRD) dibiarkan.
- **Retrieval:** teks yang sudah disamarkan dipakai sebagai query ke Astra DB. Query kedua yang tetap mengambil data upah minimum 2026 per wilayah.
- **Agent** (dengan tool kalkulator dan tanggal):
  1. mengecek cakupan (hanya PKWT; PKWTT, magang, dan kemitraan ditolak dengan sopan),
  2. mengekstrak klausul ke struktur tetap: jenis kontrak, jenis pekerjaan, jangka waktu dan perpanjangan, masa percobaan, upah dan lokasi kerja, uang kompensasi, BPJS, pengakhiran dini dan denda, penahanan dokumen, serta bentuk dan bahasa kontrak,
  3. mencocokkan setiap klausul dengan pasal yang ditemukan,
  4. menandai masalah **hanya** jika didukung teks pasal,
  5. menyusun laporan.
- **Output:** ringkasan, daftar potensi masalah (isi kontrak, penjelasan, rujukan pasal dan statusnya, keparahan, keyakinan, pertanyaan untuk HR), klausul tanpa masalah, klausul yang tidak dapat diperiksa, catatan, dan disclaimer.
- Pesan masukan tidak disimpan ke riwayat pesan Langflow (`should_store_message = false`).

### 2. `answer_labor_rule_question`

```
Chat Input ─┬─► Astra DB (top-4) ─► Parser <kutipan> ─┐
            └─────────────────────────────────────────┴─► Prompt Template ─► Agent ─► Chat Output
```

- **Input:** pertanyaan pengguna.
- **Aturan jawaban:** hanya dari kutipan yang ditemukan. Sitasi disalin persis dari header kutipan dengan format `(Regulasi, Pasal, status)`. Jika jawabannya tidak ada, sistem menjawab "Saya tidak menemukan jawabannya di sumber regulasi yang saya miliki." Jika pertanyaan mengandung klaim yang bertentangan dengan kutipan, kalimat pertama jawaban langsung membantahnya.
- **Output:** jawaban beserta sitasi pasal.

### 3. `draft_hr_questions`

```
Chat Input ─► Agent (+ Composio Gmail sebagai tool) ─► Chat Output
```

- **Input:** daftar temuan dari laporan pemeriksaan, dan bila ada, alamat email HR.
- **Proses:** menulis email berbahasa Indonesia yang sopan dan tidak menuduh (subjek "Pertanyaan Terkait Draf Kontrak Kerja (PKWT)", satu pertanyaan bernomor per temuan, nama pengirim `[Nama Anda]`).
  - Jika alamat HR tersedia, Agent memakai aksi Gmail **Create Email Draft**.
  - Jika tidak, teks email ditampilkan untuk disalin.
- **Output:** status ("Draf dibuat di Gmail (belum terkirim)" atau "Teks email siap disalin"), subjek dan isi email, serta pengingat untuk meninjau sebelum mengirim.
- **Agent tidak bisa mengirim email.** Di komponen Gmail hanya dua aksi yang aktif: **Create Email Draft** dan **List Drafts**. Aksi kirim (Send Email, Send Draft) dan semua aksi lain dimatikan, sehingga pembatasnya bersifat teknis, bukan hanya instruksi prompt. Prompt Agent juga mengabaikan instruksi di dalam input yang meminta mengirim atau menghapus email.

![Isi draf email HR di IBM Bob](docs/screenshots/bob-hr-draft.jpeg)

### 4. `ingest_labor_corpus` (internal, tidak diekspos ke Bob)

```
Read File (CSV) ─► CSV Rows to Data ─► Astra DB (embedding gemini-embedding-001)
```

- **CSV Rows to Data:** komponen kustom yang mengubah satu baris CSV menjadi satu dokumen. Kolom `text` menjadi konten, kolom lain menjadi metadata.
- **Astra DB** memakai `deletion_field = id`: dokumen dengan `id` yang sama dihapus dulu sebelum dimasukkan, sehingga ingest ulang mengganti entri, bukan menggandakannya.
- Workflow `corpus-ci` menjalankan flow ini lewat API: mengunggah CSV berisi baris yang berubah, mencari komponen Read File dan Astra DB menurut tipenya di flow yang ada di server (ID node bisa berbeda dari file JSON), lalu menjalankannya dengan `deletion_field = id`.

## Korpus regulasi

`data/labor_corpus.csv` berisi **64 entri**. Satu baris berisi satu pasal atau ketentuan, dan semuanya berada di rezim `current`. Korpus diperiksa terhadap situs pemerintah setiap hari; lihat [Memperbarui korpus](#memperbarui-korpus).

| Kolom | Keterangan |
|---|---|
| `id` | ID unik, mis. `pp35-12` |
| `regulation`, `article` | Nama regulasi dan pasal/ayat |
| `topic` | Topik, mis. `masa_percobaan`, `upah_minimum`, `thr`, `bpjs` |
| `status` | `berlaku`, `diubah`, `disisipkan`, `dimaknai_putusan_mk`, `berlaku_imbauan`, `catatan_sistem`, `belum_berlaku` (sudah terbit, belum berlaku), `tidak_berlaku` (sudah diganti, mis. UMK tahun lalu) |
| `amended_by` | Regulasi pengubah (jika ada) |
| `regime` | Rezim aturan: `current`, atau `uu_pk_2026` untuk UU Pelindungan Ketenagakerjaan (disahkan DPR 6 Oktober 2026) |
| `region`, `province` | `nasional`, atau kabupaten/kota/provinsi untuk upah minimum |
| `source_url`, `retrieved_on` | Sumber resmi dan tanggal pengambilan |
| `verification` | `checked_official` (39), `checked_secondary` (20), `accepted_single_source` (4), `system_note` (1). `pending_review` hanya dipakai bot dan tidak bisa di-merge. |
| `effective_from` | Tanggal mulai berlaku (`YYYY-MM-DD`), wajib untuk baris `belum_berlaku` |
| `text` | Teks pasal, diawali header `[Regulasi \| Pasal \| status \| rezim \| wilayah \| topik]` yang dipakai LLM untuk sitasi |

Flow pemeriksaan dan tanya aturan hanya menilai dengan rezim `current`. Pasal `uu_pk_2026` diambil terpisah (2 teratas) dan hanya disebut di "Catatan" sebagai aturan yang akan berlaku.

**Cakupan regulasi:**

- UU 13/2003 sebagaimana diubah UU 6/2023, Putusan MK No. 168/PUU-XXI/2023
- PP 35/2021 (PKWT, alih daya, waktu kerja, PHK) dan PP 36/2021 (Pengupahan)
- UU 24/2011 (BPJS), UU 4/2024 (KIA), Permenaker 6/2016 (THR), SE Menaker M/5/HK.04.00/V/2025

**Upah minimum 2026:**

- DKI Jakarta (UMP)
- Jawa Barat: Kota/Kab. Bekasi, Karawang, Depok, Kota/Kab. Bogor, Bandung
- Banten: Kota/Kab. Tangerang, Tangerang Selatan, Cilegon
- Jawa Tengah: Semarang
- DI Yogyakarta: Kota Yogyakarta
- Jawa Timur: Surabaya, Sidoarjo, Gresik, Malang

## Setup

### Prasyarat

- IBM Langflow 1.12.4 atau yang lebih baru (versi flow diekspor)
- IBM Bob
- Akun DataStax Astra DB dengan database `cek_pkwt`
- API key OpenAI dan/atau Google AI (Gemini)
- Akun Composio yang terhubung ke Gmail (untuk `draft_hr_questions`)

### Variabel lingkungan

Salin `.env.example` menjadi `.env` lalu isi:

```env
ASTRA_DB_PKWT=      # Application token Astra DB
COMPOSIO_PKWT=      # API key Composio (Gmail)
GOOGLE_API_KEY=     # Untuk embedding gemini-embedding-001
OPENAI_API_KEY=     # Untuk Agent gpt-5.4-mini
```

Variabel untuk backend web app (`LANGFLOW_URL`, `LANGFLOW_API_KEY`, `LANGFLOW_FLOW_*`, `FRONTEND_ORIGINS`) dijelaskan di [Menjalankan web app](#menjalankan-web-app). Untuk server, kunci provider di atas diisi di `deploy/.env` (lihat [Deploy](#deploy)). `sync/corpus_sync.py` juga membaca `.env` ini saat dijalankan lokal, mis. `OPENAI_API_KEY` untuk menyusun draf.

Flow merujuk nama-nama variabel ini sebagai *Global Variables* Langflow, jadi nilainya tidak tersimpan di file JSON. Daftarkan variabelnya dengan salah satu cara berikut:

- **Manual:** Settings → Global Variables, buat variabel dengan nama yang sama persis.
- **Otomatis dari environment:** jalankan Langflow dengan
  ```env
  LANGFLOW_STORE_ENVIRONMENT_VARIABLES=true
  LANGFLOW_VARIABLES_TO_GET_FROM_ENVIRONMENT=ASTRA_DB_PKWT,COMPOSIO_PKWT,GOOGLE_API_KEY,OPENAI_API_KEY
  ```

### Langkah setup

1. Jalankan Langflow, lalu impor keempat file JSON dari folder `langflow/`.
2. Komponen **Astra DB** sudah membaca token dari `ASTRA_DB_PKWT`. Jika database Anda berbeda, pilih ulang database dan endpoint-nya (daftar endpoint akan terisi otomatis dari token). Pastikan nama koleksi `corpus_v1` dan model embedding sama di semua flow.
3. Tambahkan API key model untuk Agent di **Settings → Model Providers** (OpenAI, dan Google jika ingin memakai model Gemini). Field `api_key` di komponen Agent hanya *override*; jika dikosongkan, Agent memakai key dari Model Providers sesuai model yang dipilih di dropdown "Language Model".
4. Buka flow `ingest_labor_corpus`, unggah `data/labor_corpus.csv` ke komponen **Read File**, lalu jalankan untuk mengisi vector store.
5. Pada flow `draft_hr_questions`, hubungkan komponen **Gmail** ke akun Composio Anda (OAuth). Aksi yang aktif sudah dibatasi ke Create Email Draft dan List Drafts; jangan aktifkan aksi kirim.
6. Uji setiap flow di Playground Langflow sebelum menghubungkannya ke Bob.

## Menghubungkan IBM Bob ke Langflow

Langflow mengekspos flow dalam satu project sebagai **MCP server**, dan IBM Bob terhubung sebagai **MCP client**.

1. **Siapkan MCP server di Langflow.**
   - Buka project yang berisi flow CekPKWT, lalu buka tab **MCP Server**.
   - Aktifkan tiga flow sebagai tool: `check_work_contract`, `answer_labor_rule_question`, dan `draft_hr_questions`. Jangan aktifkan `ingest_labor_corpus`.
   - Pastikan nama dan deskripsi setiap tool jelas, karena Bob memilih tool berdasarkan keduanya.
2. **Siapkan autentikasi.** Pakai autentikasi API key, lalu buat API key Langflow di Settings → API Keys.
3. **Salin konfigurasi.** Ambil JSON konfigurasi untuk transport **Streamable HTTP** dari tab MCP Server.
4. **Daftarkan di Bob.** Tambahkan konfigurasi itu ke `mcp.json` milik IBM Bob. Bentuknya kurang lebih seperti ini; pakai nilai yang disalin dari Langflow:

   ```json
   {
     "mcpServers": {
       "cekpkwt": {
         "type": "streamable-http",
         "url": "http://localhost:7860/api/v1/mcp/project/<PROJECT_ID>/streamable",
         "headers": {
           "x-api-key": "<LANGFLOW_API_KEY>"
         }
       }
     }
   }
   ```

   Jangan commit file konfigurasi yang berisi API key asli.
5. **Uji di Bob.** Pastikan ketiga tool muncul di daftar tool MCP Bob, lalu coba contoh di bawah.

Bob mengirim teks pengguna ke Chat Input setiap flow dan menerima Chat Output sebagai hasil tool. Logika workflow tetap berada di Langflow, sedangkan logika percakapan berada di Bob.

**Memakai Langflow di server.** Langflow di server tidak diekspos ke internet. Buka SSH tunnel dari komputer yang menjalankan Bob, lalu biarkan terminalnya terbuka selama Bob dipakai:

```bash
ssh -N -L 7860:127.0.0.1:7860 <user>@<server>
```

Selama tunnel terbuka, URL `http://localhost:7860/...` di `mcp.json` mengarah ke Langflow di server. Pakai `PROJECT_ID` dan API key dari Langflow server, karena keduanya berbeda dari instance lokal.

## Menjalankan web app

Selain lewat IBM Bob, CekPKWT bisa dipakai lewat web app yang terdiri dari dua bagian terpisah:

- **`backend/`**: FastAPI (Python). Memvalidasi input, menyimpan API key Langflow di server, lalu meneruskan permintaan ke ketiga flow lewat API `/api/v1/run`. Laporan Markdown dari flow diubah menjadi JSON (`backend/report.py`). Teks kontrak tidak dicatat di log dan tidak disimpan. Setiap permintaan memakai sesi Langflow baru, sehingga pesan satu pengguna tidak masuk ke memori agent pengguna lain.
- **`frontend/`**: React + Vite + TypeScript. Lima halaman: beranda, tempel kontrak (dengan pratinjau penyamaran data pribadi), laporan, draf email HR, dan tanya aturan. Warna dan font diambil dari `assets/design-tokens.css` (sumbernya `docs/brand-guidelines.md`).

Isi `LANGFLOW_URL` dan `LANGFLOW_API_KEY` di `.env` (lihat `.env.example`). Jika Langflow memberi ID baru saat flow diimpor, isi juga `LANGFLOW_FLOW_CHECK`, `LANGFLOW_FLOW_ASK`, dan `LANGFLOW_FLOW_HR`. ID yang ada di `.env.example` dan `backend/app.py` adalah ID dari file JSON, jadi ambil ID baru dari URL editor Langflow (`/flow/<ID>`) di instance tempat flow diimpor. API key Langflow juga hanya berlaku di instance yang membuatnya.

Untuk pengembangan lokal, biarkan `VITE_API_BASE` (frontend, lihat `frontend/.env.example`) dan `FRONTEND_ORIGINS` (backend) kosong: Vite meneruskan `/api` ke backend di origin yang sama.

```bash
# Terminal 1: backend di port 8000
cd backend
python -m venv .venv
.venv/Scripts/activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --env-file ../.env

# Terminal 2: frontend di port 5173 (meneruskan /api ke backend)
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173. Uji parser laporan dengan `python test_report.py` di folder `backend/`.

Catatan:

- **Draf email tidak dibuat di Gmail.** Komponen Composio terhubung ke satu akun, jadi draf dari semua pengunjung web akan masuk ke kotak surat pemilik aplikasi. Web app membuka jendela tulis Gmail di akun pengguna sendiri (tanpa login ke CekPKWT), aplikasi email lewat `mailto:`, atau WhatsApp lewat `wa.me`. Alur draf Gmail tetap tersedia lewat IBM Bob.
- **Laporan, draf email, dan percakapan Tanya aturan disimpan sementara di `localStorage` browser** agar tidak hilang saat halaman dimuat ulang atau tab tertutup tidak sengaja. Data terhapus otomatis 30 menit setelah terakhir dibuka (`TTL_MINUTES` di `frontend/src/storage.ts`) dan bisa dihapus manual lewat tombol "Hapus sekarang" di laporan. Teks kontrak mentah tidak pernah disimpan karena masih berisi data pribadi. Tidak ada yang disimpan di server.
- **Untuk produksi**, frontend dan backend berjalan di domain berbeda. Lihat [Deploy](#deploy).

## Deploy

Versi produksi terdiri dari dua bagian:

- **Frontend:** di-hosting di Vercel, di https://cek-pkwt.briantedjo.my.id.
- **Backend dan Langflow:** berjalan di server Debian self-hosted. Hanya backend yang dapat diakses publik, lewat Cloudflare Tunnel dan nginx. Langflow dan PostgreSQL hanya mendengarkan di `127.0.0.1`.

Semua berkas server ada di folder `deploy/`.

### Frontend (Vercel)

| Pengaturan | Nilai |
|---|---|
| Root directory | `frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `VITE_API_BASE` = alamat backend, mis. `https://cekpkwt-api.<domain>` (tanpa `/api` di akhir) |

`VITE_API_BASE` dibaca saat build, jadi deploy ulang setelah mengubahnya. Build mengimpor logo dari `../assets`, sehingga Vercel perlu mengakses seluruh repository, bukan hanya folder `frontend/`. Aplikasi memakai hash route (`#/cek`), jadi tidak perlu aturan rewrite.

### Server

Prasyarat: Docker dan Docker Compose, Python 3 dengan `venv`, nginx, serta Cloudflare Tunnel dengan hostname wildcard yang diarahkan ke nginx di port 80.

1. **Clone repository** ke server, mis. `~/apps/cek-pkwt`. Seluruh repository diperlukan karena backend membaca `data/labor_corpus.csv`.
2. **Jalankan Langflow dan PostgreSQL** (Langflow 1.12.4, versi tempat flow diekspor):

   ```bash
   cd ~/apps/cek-pkwt/deploy
   mkdir -p langflow-data && sudo chown -R 1000:0 langflow-data
   cp .env.example .env && chmod 600 .env   # isi password, secret key, dan kunci provider
   docker compose up -d
   ```

   Kunci provider (`ASTRA_DB_PKWT`, `COMPOSIO_PKWT`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`) diteruskan ke Langflow sebagai Global Variables. Tentukan password PostgreSQL sejak awal, karena PostgreSQL hanya membacanya saat volume database pertama kali dibuat.
3. **Siapkan flow.** Buka Langflow lewat SSH tunnel (lihat di bawah), impor keempat flow, uji di Playground, buat API key, dan catat ID ketiga flow yang dipakai backend serta ID `ingest_labor_corpus` (untuk sinkronisasi korpus). Menjalankan ulang `ingest_labor_corpus` aman karena entri dengan `id` yang sama diganti.
4. **Jalankan backend** sebagai service systemd:

   ```bash
   cd ~/apps/cek-pkwt
   cp .env.example .env && chmod 600 .env
   # isi: LANGFLOW_URL=http://127.0.0.1:7860, LANGFLOW_API_KEY, LANGFLOW_FLOW_*,
   #      FRONTEND_ORIGINS=https://cek-pkwt.briantedjo.my.id
   cd backend
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   sed "s/CHANGE_ME_user/$USER/g" ../deploy/systemd/cekpkwt-api.service | sudo tee /etc/systemd/system/cekpkwt-api.service > /dev/null
   sudo systemctl daemon-reload
   sudo systemctl enable --now cekpkwt-api
   ```

   Di server, kunci provider di `.env` root boleh dikosongkan karena hanya Langflow yang memakainya.
5. **Pasang situs nginx.** Sesuaikan `server_name` di `deploy/nginx/cekpkwt-api.conf` dengan alamat backend Anda, lalu:

   ```bash
   sudo cp ~/apps/cek-pkwt/deploy/nginx/cekpkwt-api.conf /etc/nginx/sites-available/cekpkwt-api
   sudo ln -s /etc/nginx/sites-available/cekpkwt-api /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

   Situs ini membatasi jumlah permintaan per pengunjung berdasarkan header `CF-Connecting-IP`, karena di balik Cloudflare Tunnel semua permintaan datang dari `cloudflared`.
6. **Uji:**

   ```bash
   curl -s https://<alamat-backend>/api/regions
   curl -s -X POST https://<alamat-backend>/api/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "Apa itu kompensasi akhir PKWT?"}'
   ```

7. **Pasang runner GitHub** untuk sinkronisasi dan unggah korpus: lihat [Persiapan (sekali)](#persiapan-sekali).

Backend, Langflow, dan PostgreSQL berjalan otomatis setelah server dinyalakan ulang: backend lewat `systemctl enable`, kedua container lewat `restart: unless-stopped`, dan runner GitHub lewat service-nya (`svc.sh install`).

### Mengakses Langflow di server

Langflow tidak punya alamat publik. Untuk membuka editor atau menghubungkan IBM Bob, buat SSH tunnel dari komputer Anda:

```bash
ssh -N -L 7860:127.0.0.1:7860 <user>@<server>
```

Terminal itu tampak diam selama tunnel aktif. Biarkan terbuka, lalu buka `http://localhost:7860`. Tekan Ctrl+C untuk menutupnya.

### Memperbarui

```bash
cd ~/apps/cek-pkwt && git pull
sudo systemctl restart cekpkwt-api      # perubahan di backend/
cd deploy && docker compose up -d        # perubahan di deploy/
```

- Jika `backend/requirements.txt` berubah, jalankan `backend/.venv/bin/pip install -r backend/requirements.txt` sebelum restart.
- Jika file flow berubah, impor ulang di Langflow dan periksa apakah ID-nya berubah.
- Frontend di Vercel dibangun ulang dari repository; tidak ada langkah di server.

### Log dan pemecahan masalah

| Yang ingin dilihat | Perintah |
|---|---|
| Permintaan ke backend dan alasan error dari Langflow | `journalctl -u cekpkwt-api -f` |
| Jalannya flow | `docker compose logs -f langflow` (dari folder `deploy/`) |
| Permintaan yang ditolak rate limit | `sudo tail -f /var/log/nginx/error.log` |
| Sinkronisasi harian dan unggah korpus | GitHub → Actions → run `corpus-sync` / `corpus-ci` (perlu login). Tabel sumber dan usulan ada di halaman ringkasan run. |
| Status runner GitHub | `cd ~/actions-runner && sudo ./svc.sh status` |

- **"Layanan CekPKWT sedang tidak tersedia" (502):** Langflow menolak permintaan. `journalctl` menunjukkan alasannya, biasanya API key yang salah (401/403) atau ID flow yang berubah (404).
- **"Tidak bisa terhubung ke server" di browser:** biasanya CORS. Pastikan `FRONTEND_ORIGINS` sama persis dengan alamat frontend (dengan `https://`, tanpa path), lalu restart backend.
- **Permintaan ke `/api/...` di domain frontend sendiri (404):** build frontend tidak memuat `VITE_API_BASE`. Periksa variabelnya di Vercel, lalu deploy ulang.
- **Pemeriksaan kontrak yang panjang terputus (524):** setahu kami, Cloudflare memutus permintaan yang berjalan lebih dari sekitar 100 detik. Jika sering terjadi, turunkan `LANGFLOW_TIMEOUT` (default 180 detik) agar pengguna mendapat pesan error yang jelas.

## Contoh penggunaan

| Pengguna menulis di Bob | Tool yang dipanggil |
|---|---|
| "Tolong cek kontrak ini sebelum saya tanda tangan: …" | `check_work_contract` |
| "Apa itu kompensasi akhir PKWT?" | `answer_labor_rule_question` |
| "Katanya kontrak PKWT boleh pakai masa percobaan 3 bulan, bener kan?" | `answer_labor_rule_question` |
| "Bantu buatkan email ke HR (hr@perusahaan.co.id) soal temuan tadi" | `draft_hr_questions` |

### Hasil nyata di IBM Bob

**Pemeriksaan kontrak:** Bob memanggil `check_work_contract` dan menampilkan 8 potensi masalah.

![Hasil check_work_contract di IBM Bob](docs/screenshots/bob-check-contract.jpeg)

**Tanya aturan dan permintaan draf email:** Bob memanggil `answer_labor_rule_question` untuk UMK Karawang, lalu `draft_hr_questions`.

![Tanya UMK dan permintaan draf email di IBM Bob](docs/screenshots/bob-rule-question.jpeg)

## Hasil evaluasi

> Bagian ini diisi dari hasil pengujian nyata. Jangan isi dengan perkiraan.

| Metrik | Hasil |
|---|---|
| Masalah yang sengaja ditanam dan berhasil terdeteksi | [X dari Y] pada [N] kontrak uji fiktif ([%]) |
| Alarm palsu pada kontrak bersih | [Z] pada [M] kontrak |
| Sitasi pasal yang sesuai teks resmi (verifikasi manual) | [X%] |
| Waktu review kontrak | dari [A] menit menjadi [B] menit ([N] responden) |

## Responsible AI

- **Hanya dari sumber:** jawaban dan temuan hanya boleh berasal dari pasal yang diambil dari korpus. Pasal, angka, atau akibat hukum tidak boleh dikarang.
- **Jujur saat tidak tahu:** klausul yang tidak bisa dicocokkan dengan pasal dimasukkan ke "Tidak dapat diperiksa". Pertanyaan tanpa sumber dijawab "tidak ditemukan", disertai saran ke Disnaker atau LBH.
- **Transparansi rezim aturan:** setiap rujukan mencantumkan status pasal, dan setiap laporan menyebut rezim aturan yang dipakai.
- **Privasi:** data pribadi disamarkan sebelum teks dikirim ke LLM atau dipakai sebagai query. Kontrak tidak pernah dimasukkan ke basis data vektor, dan pesan masukan pemeriksaan kontrak tidak disimpan ke riwayat pesan Langflow.
- **Tahan prompt injection:** teks kontrak diperlakukan sebagai data, bukan instruksi. Teks yang mencoba memberi perintah ke AI dilaporkan di bagian "Catatan".
- **Bahasa yang tidak menghakimi:** sistem memakai "mungkin bertentangan dengan" atau "perlu dikonfirmasi", tidak pernah "ilegal" atau "melanggar hukum".
- **Kendali di tangan pengguna:** agent hanya bisa membuat draf email. Aksi kirim Gmail dimatikan di level komponen, jadi agent secara teknis tidak dapat mengirim email. Pengguna meninjau, mengedit, dan mengirim sendiri.
![Draf tersimpan di Gmail dan belum terkirim](docs/screenshots/gmail-draft.jpeg)
- **Bukan nasihat hukum:** setiap laporan ditutup dengan disclaimer dan rujukan ke LBH atau Disnaker.
- **Kredensial aman:** semua key disimpan sebagai Global Variables Langflow, tidak di file flow.

## Keterbatasan

- Hanya memeriksa **PKWT**. PKWTT, magang, outsourcing, dan kemitraan/freelance berada di luar cakupan.
- Korpus hanya berisi **64 entri** dari rezim aturan saat ini. UU Pelindungan Ketenagakerjaan (disahkan DPR 6 Oktober 2026) baru masuk setelah diundangkan dan PR-nya ditinjau.
- Sinkronisasi harian belum bisa membaca JDIH Banten (pencarian situsnya error), JDIH Jawa Timur, dan DPR (keduanya memblokir bot). Ketiganya dicek manual; status blokirnya tampil di ringkasan job setiap hari.
- Bot tidak bisa membaca PDF hasil pindaian (tanpa lapisan teks, sering terjadi pada Surat Edaran) karena tidak ada OCR. Regulasi seperti ini muncul sebagai issue "needs manual entry".
- Data upah minimum 2026 hanya mencakup wilayah yang tercantum di atas. Lokasi kerja di luar daftar itu dilaporkan sebagai "Tidak dapat diperiksa".
- Sebagian entri korpus diverifikasi dari sumber sekunder (`checked_secondary`) atau satu sumber saja (`accepted_single_source`).
- Retrieval mengambil 4 pasal teratas per query, sehingga pasal relevan bisa saja terlewat pada kontrak yang panjang.
- Redaksi data pribadi berbasis regex dan bisa melewatkan format yang tidak umum.
- Input berupa teks; kontrak dalam bentuk PDF atau foto perlu disalin menjadi teks terlebih dahulu.
- Bisa digunakan lewat IBM Bob (IDE), Playground Langflow, atau web app di https://cek-pkwt.briantedjo.my.id.
- Backend, Langflow, dan runner sinkronisasi korpus berjalan di satu server self-hosted, sehingga ketersediaannya bergantung pada listrik dan koneksi internet server tersebut. Belum ada server cadangan.
- Pembatasan jumlah permintaan baru diterapkan di nginx per pengunjung. Belum ada kuota per pengguna atau autentikasi pengguna.

## Rencana pengembangan

- **Regulasi:** meninjau PR UU Pelindungan Ketenagakerjaan begitu diundangkan, lalu memindahkan flow ke rezim baru saat masa transisinya berakhir.
- **Wilayah:** menambahkan upah minimum provinsi dan kabupaten/kota lain.
- **Jenis kontrak:** memperluas cakupan ke PKWTT, magang, dan outsourcing.
- **Distribusi:** integrasi dengan platform lowongan kerja sebagai fitur "cek kontrak", serta lisensi untuk pusat karier kampus dan serikat pekerja.
- **Pasar kedua:** pemeriksaan kepatuhan template kontrak untuk UMKM sebelum merekrut.

## Memperbarui korpus

Korpus hanya berubah lewat pull request, baik dari bot maupun manual. Tidak ada teks yang masuk ke Astra DB sebelum PR-nya ditinjau dan di-merge. Spesifikasi lengkap: [`docs/specs/corpus-sync.md`](docs/specs/corpus-sync.md).

### Sinkronisasi harian

Workflow `corpus-sync` berjalan setiap hari pukul 02.00 WIB di self-hosted runner di server (GitHub bisa memulainya sedikit terlambat saat sibuk):

1. Bot membaca daftar regulasi terbaru di JDIH Kemnaker, JDIH BPK, JDIH DKI Jakarta, Jawa Tengah, Jawa Barat, DI Yogyakarta, serta putusan MK. Jawa Barat, DIY, dan MK dibuka lewat headless browser karena dilindungi Cloudflare atau berupa aplikasi JavaScript.
2. Regulasi dianggap relevan jika jenisnya dipakai korpus dan judul atau "tentang"-nya menyebut topik PKWT (upah, PKWT, THR, BPJS, PHK, dsb.) atau regulasi yang sudah dikutip korpus. Untuk JDIH provinsi, hanya keputusan UMP/UMK untuk tahun yang belum ada di korpus.
3. Bot mengunduh PDF resminya, lalu LLM (`gpt-5.4-mini`) memilih pasal yang relevan dan baris lama yang diubahnya. Kode menolak teks yang tidak ditemukan kata per kata di PDF, lalu mengisi kolom lain sendiri.
4. Bot membuka satu PR per regulasi (`[corpus-sync <kunci>] …`). Semua baris barunya bertanda `verification = pending_review`. Jika bot tidak bisa menyusun draf (biasanya PDF hasil pindaian), bot membuka issue "needs manual entry". Jika tidak ada pasal yang relevan, bot membuat issue tertutup sebagai catatan.
5. Peninjau (@britoddd atau @Joelcrl lewat `CODEOWNERS`) mencocokkan setiap baris dengan PDF, mengisi `effective_from` untuk baris `belum_berlaku`, lalu mengubah `pending_review` menjadi `checked_official`. CI menolak PR selama masih ada `pending_review`.
6. Setelah merge, workflow `corpus-ci` hanya mengunggah baris yang berubah ke `ingest_labor_corpus`. Tidak ada langkah manual untuk memperbarui vector store.

**Yang perlu dilakukan peninjau:** tidak perlu memeriksa setiap hari. Pada kebanyakan hari tidak ada regulasi baru, sehingga tidak ada PR maupun issue. Saat PR muncul, GitHub mengirim permintaan review (email dan notifikasi) ke kedua peninjau.

#### Meninjau PR bot

```bash
git fetch origin && git switch corpus-sync/<kunci>
# Edit data/labor_corpus.csv: cocokkan setiap baris baru dengan PDF yang ditautkan di PR,
# perbaiki atau hapus baris yang salah, lalu ubah pending_review menjadi checked_official
sync/.venv/Scripts/python sync/corpus_sync.py validate --base origin/main   # Linux/macOS: sync/.venv/bin/
git commit -am "Tinjau baris <kunci>" && git push
```

Push ini menjalankan check `validate`. Setelah hijau, merge PR-nya. PR bot sendiri tidak menjalankan check sebelum ada push dari manusia, karena GitHub tidak memicu workflow dari PR yang dibuka oleh token Actions.

Periksa terutama nomor pasal: lapisan teks PDF kadang membaca huruf sebagai angka (mis. "Pasal 35I" terbaca "Pasal 351"), dan pemeriksaan kata per kata tidak bisa menangkapnya.

#### Issue "needs manual entry"

Alasannya tercantum di ringkasan run `corpus-sync`, biasanya PDF hasil pindaian. Jika regulasinya relevan (mis. Surat Edaran THR), tambahkan barisnya secara [manual](#manual) lalu tutup issue-nya. Jika tidak relevan, cukup tutup issue-nya.

Catatan:

- **Menolak usulan:** tutup PR tanpa merge. Regulasi itu tidak akan diusulkan lagi. Untuk mengusulkannya ulang, hapus tag `[corpus-sync …]` dari judul PR atau issue-nya.
- **Mulai berlaku:** saat `effective_from` tiba, bot membuka PR yang mengubah `belum_berlaku` menjadi `berlaku`, dan UMK tahun sebelumnya menjadi `tidak_berlaku`.
- **Wilayah baru:** backend membaca daftar wilayah dari CSV saat start. Jika PR menambah wilayah yang belum ada, jalankan `git pull` dan restart backend di server (lihat [Memperbarui](#memperbarui)).
- **Run yang gagal:** run ditandai gagal (dan GitHub mengirim email) hanya jika JDIH Kemnaker atau BPK tidak terbaca, atau penyusunan draf suatu regulasi error. Sumber lain yang terblokir hanya tercatat `blocked` di tabel. Tidak ada yang hilang: setiap run memeriksa 30 hari terakhir, jadi run berikutnya menyusul.
- **Jeda 60 hari:** di repository publik, GitHub menonaktifkan jadwal workflow setelah 60 hari tanpa aktivitas repository. GitHub mengirim email peringatan; aktifkan lagi di tab Actions.
- **Konflik:** PR bot menambahkan baris di akhir file. Jika dua PR terbuka bersamaan, setelah satu di-merge selesaikan konflik yang lain di editor GitHub dengan mempertahankan kedua blok baris.
- **Situs yang belum terbaca bot** (Banten, Jawa Timur, DPR): susun draf dari PDF resminya secara lokal, lalu buka PR seperti biasa.

  ```bash
  python -m venv sync/.venv && sync/.venv/Scripts/pip install -r sync/requirements.txt   # Linux/macOS: sync/.venv/bin/
  sync/.venv/Scripts/python sync/corpus_sync.py draft --province "Jawa Timur" \
    --title "Keputusan Gubernur Jawa Timur Nomor ... Tahun 2026" \
    --about "Upah Minimum Kabupaten/Kota Tahun 2027" --pdf <URL PDF resmi> --apply
  ```

  `OPENAI_API_KEY` dibaca dari `.env` root; variabel lingkungan yang sudah diset tetap didahulukan.

### Persiapan (sekali)

Jadwal harian dan tombol "Run workflow" baru muncul setelah kedua workflow ada di `main`. Siapkan runner (langkah 2) sebelum merge, karena merge yang mengubah CSV menjalankan job unggah.

1. **Secrets** (Settings → Secrets and variables → Actions → tab **Secrets**, bagian Repository secrets): `OPENAI_API_KEY` untuk menyusun draf, `LANGFLOW_API_KEY` (dibuat di Langflow server, sama dengan milik backend), dan `LANGFLOW_FLOW_INGEST` (ID flow `ingest_labor_corpus` di server, atau URL editornya `…/flow/<ID>`). `LANGFLOW_URL` opsional; bawaannya `http://127.0.0.1:7860`.
2. **Self-hosted runner di server.** Kedua workflow berjalan di runner yang dipasang di server (Settings → Actions → Runners → New self-hosted runner, jalankan sebagai service): job unggah karena Langflow hanya mendengarkan `127.0.0.1`, dan sinkronisasi harian karena JDIH BPK, Jawa Barat, dan MK memblokir runner GitHub (IP luar negeri). Server perlu `python3` dengan modul `venv`, [`gh` CLI](https://github.com/cli/cli/blob/trunk/docs/install_linux.md), dan library sistem untuk Chromium (sekali):

   ```bash
   python3 -m venv /tmp/pw && /tmp/pw/bin/pip install -q playwright \
     && sudo /tmp/pw/bin/python -m playwright install-deps chromium && rm -rf /tmp/pw
   ```

3. **Pengaturan Actions** (Settings → Actions → General):
   - "Approval for running fork pull request workflows": pilih "Require approval for all external contributors", karena repository ini publik. Job unggah sendiri tidak pernah berjalan untuk `pull_request`.
   - "Workflow permissions": centang "Allow GitHub Actions to create and approve pull requests". Tanpa ini bot tidak bisa membuka PR.
   - **Ruleset** (Settings → Rules → Rulesets → New branch ruleset, target `main`): aktifkan "Require status checks to pass" dengan check `validate` (berjalan di setiap PR). Tanpa ini PR yang masih `pending_review` tetap bisa di-merge. "Require review from Code Owners" opsional.
   - **Collaborators:** pastikan kedua peninjau punya akses write, agar `CODEOWNERS` bisa meminta review mereka.
4. **Uji sumber.** Jalankan workflow `corpus-sync` secara manual dengan `dry_run` dicentang, lalu periksa tabel sumber di halaman run. Untuk mengusulkan regulasi yang lebih lama dari 30 hari, jalankan sekali tanpa `dry_run` dengan `since` diisi, mis. `2025-10-01`.
5. **Impor ulang** `check_work_contract` dan `answer_labor_rule_question` di Langflow. Jika ID-nya berubah, perbarui `LANGFLOW_FLOW_CHECK` dan `LANGFLOW_FLOW_ASK` di `.env` server lalu restart backend. `ingest_labor_corpus` tidak wajib diimpor ulang: job unggah mencari komponennya sendiri dan mengirim `deletion_field = id`.
6. **Bersihkan entri ganda lama.** Jalankan workflow `corpus-ci` secara manual sekali. Semua baris diunggah ulang dan entri ganda dari ingest manual sebelumnya terhapus.

### Manual

Ubah `data/labor_corpus.csv` di sebuah branch, lalu buka PR. Jangan menghapus baris: jika pasal lama diubah atau diganti, ubah `status` dan isi `amended_by`. Sertakan header `[...]` di awal kolom `text`, serta `source_url`, `retrieved_on`, dan `verification`. Periksa dengan `sync/.venv/Scripts/python sync/corpus_sync.py validate --base origin/main` sebelum push.

Untuk melihat apa yang akan diusulkan bot tanpa membuka PR, jalankan sinkronisasi secara lokal. Ringkasannya tersimpan di file:

```bash
PYTHONIOENCODING=utf-8 GITHUB_STEP_SUMMARY=~/corpus-sync-summary.md \
  sync/.venv/Scripts/python sync/corpus_sync.py watch --since 2025-10-01 --dry-run 2>&1 | tee ~/corpus-sync.log
```

### Pemecahan masalah

| Pesan di log run | Penyebab dan solusi |
|---|---|
| `corpus-sync` gagal, `kemnaker` atau `bpk` berstatus `blocked` | Situsnya menolak koneksi saat itu. Biarkan; run berikutnya memeriksa ulang 30 hari terakhir. Jika berulang beberapa hari, coba buka situsnya dari server. |
| `LANGFLOW_API_KEY is empty` / `LANGFLOW_FLOW_INGEST is empty` | Secret belum diisi, atau dibuat di tab Variables atau sebagai environment secret. Isi di Repository secrets. |
| `Langflow upload returned 403` | API key bukan milik Langflow di server. API key hanya berlaku di instance yang membuatnya; pakai key yang sama dengan backend. |
| `Langflow returned 404 for flow …` | `LANGFLOW_FLOW_INGEST` salah. Ambil ID dari URL editor flow di Langflow server (`/flow/<ID>`). |
| `needs exactly one Read File and one Astra DB component` | `LANGFLOW_FLOW_INGEST` menunjuk flow lain, bukan `ingest_labor_corpus`. |
| Job menunggu lama di status *Queued* | Runner di server mati. Periksa dengan `sudo ./svc.sh status` di `~/actions-runner`. |

## Struktur repository

```
.
├── .env.example                 # Template variabel lingkungan (tanpa nilai): kunci provider + backend
├── .github/
│   ├── CODEOWNERS               # Peninjau wajib untuk perubahan korpus
│   └── workflows/
│       ├── corpus-sync.yml      # Cek situs resmi setiap hari, buka PR korpus
│       └── corpus-ci.yml        # Validasi setiap PR; unggah baris korpus yang berubah setelah merge
├── assets/                      # Logo (SVG) dan design token hasil brand guidelines
├── backend/                     # FastAPI: proxy ke Langflow + parser laporan
├── data/
│   └── labor_corpus.csv         # Korpus regulasi (64 entri) beserta sumbernya
├── deploy/                      # Berkas deploy server
│   ├── docker-compose.yml       # Langflow 1.12.4 + PostgreSQL
│   ├── .env.example             # Template variabel khusus server
│   ├── nginx/
│   │   └── cekpkwt-api.conf     # Situs nginx untuk backend, dengan rate limit
│   └── systemd/
│       └── cekpkwt-api.service  # Service systemd untuk backend
├── docs/
│   ├── brand-guidelines.md      # Identitas visual, suara brand, dan pesan
│   ├── specs/corpus-sync.md     # Spesifikasi sinkronisasi korpus harian
│   └── screenshots/             # Bukti alur: Bob, Langflow, Gmail
├── frontend/                    # React + Vite + TypeScript (di-hosting di Vercel)
│   └── .env.example             # Template VITE_API_BASE
├── langflow/                    # Ekspor JSON flow (berisi prompt lengkap)
│   ├── answer_labor_rule_question.json
│   ├── check_work_contract.json
│   ├── draft_hr_questions.json
│   └── ingest_labor_corpus.json
└── sync/                        # Sinkronisasi korpus: sumber, draf, validasi, unggah
    ├── corpus_sync.py           # CLI: watch | draft | validate | ingest
    ├── sources.py               # Satu fungsi per situs resmi
    ├── requirements.txt         # httpx, pypdf, openai, playwright
    └── test_corpus_sync.py      # python sync/test_corpus_sync.py
```

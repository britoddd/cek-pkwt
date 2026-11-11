import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { checkContract, getRegions, type CheckResult } from '../api'
import { Icon, Loading, Steps } from '../components'
import { redact } from '../redact'
import { detectRegion } from '../region'
import { TTL_MINUTES } from '../storage'

// Same limits as backend/app.py.
const MIN_CHARS = 50
const MAX_CHARS = 60_000
const OTHER = 'lainnya'

const TOPICS = ['Jangka waktu', 'Masa percobaan', 'Upah minimum', 'Uang kompensasi', 'BPJS',
  'Denda pengakhiran dini', 'Penahanan dokumen', 'Bentuk & bahasa kontrak']

// Fictional contract for demos; every number and name in it is made up.
const SAMPLE = `PERJANJIAN KERJA WAKTU TERTENTU
Nomor: 045/PKWT/HRD/X/2026

Yang bertanda tangan di bawah ini:
Nama: Anisa Rahmawati
NIK: 3174 0000 0000 0001
Tempat, tanggal lahir: Jakarta, 2 Mei 2003
Alamat: Jl. Contoh No. 12, Jakarta Selatan
Email: anisa@example.com
selanjutnya disebut Karyawan.

Pasal 3 – Jangka Waktu
Perjanjian ini berlaku selama 12 (dua belas) bulan terhitung sejak tanggal mulai bekerja.

Pasal 4 – Masa Percobaan
Karyawan menjalani masa percobaan selama 3 (tiga) bulan terhitung sejak tanggal mulai bekerja.

Pasal 5 – Upah
Upah pokok sebesar Rp5.200.000 (lima juta dua ratus ribu rupiah) per bulan. Lokasi kerja: Jakarta Selatan.

Pasal 6 – BPJS
Perusahaan mendaftarkan Karyawan sebagai peserta BPJS Ketenagakerjaan dan BPJS Kesehatan.

Pasal 7 – Pengakhiran
Apabila Karyawan mengundurkan diri sebelum berakhirnya masa kontrak, Karyawan wajib membayar denda sebesar Rp20.000.000.`

const MAX_PDF_BYTES = 10 * 1024 * 1024

// Read the PDF in the browser, so the file never leaves the device; only the extracted text
// goes through the same redaction preview as pasted text. pdf.js is loaded on first use.
async function pdfToText(file: File): Promise<string> {
  const [pdfjs, { default: workerSrc }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const pdf = await task.promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const { items } = await (await pdf.getPage(i)).getTextContent()
    pages.push(items.map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : '') : '')).join(''))
  }
  await task.destroy() // also stops the worker
  return pages.join('\n\n').replace(/[ \t]+\n/g, '\n').trim()
}

export default function Check({ onChecked }: { onChecked: (result: CheckResult) => void }) {
  const [contract, setContract] = useState('')
  const [region, setRegion] = useState('')
  const [regions, setRegions] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const preview = redact(contract)
  // Read from the redacted text, so a masked home address never counts as the work location.
  const detected = detectRegion(preview.text, regions)

  useEffect(() => {
    getRegions().then(setRegions).catch(() => setRegions([]))
  }, [])

  function pickPdf(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again
    if (file) loadPdf(file)
  }

  function dropPdf(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && !reading && !loading) loadPdf(file)
  }

  async function loadPdf(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError('File harus berformat PDF.')
    if (file.size > MAX_PDF_BYTES) return setError('File PDF terlalu besar. Maksimal 10 MB.')
    setError('')
    setReading(true)
    try {
      const text = await pdfToText(file)
      if (text.length < MIN_CHARS) {
        setError('Teks tidak terbaca dari PDF ini. Kemungkinan PDF hasil scan atau foto; salin teksnya secara manual.')
      } else {
        setContract(text)
      }
    } catch {
      setError('PDF tidak bisa dibuka. Pastikan file tidak rusak atau dilindungi kata sandi.')
    } finally {
      setReading(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const text = contract.trim()
    if (text.length < MIN_CHARS) return setError('Teks kontrak terlalu pendek. Tempel seluruh isi kontrak, tanpa diringkas.')
    if (text.length > MAX_CHARS) return setError(`Teks kontrak terlalu panjang. Maksimal ${MAX_CHARS.toLocaleString('id-ID')} karakter.`)
    setError('')
    setLoading(true)
    try {
      const res = await checkContract(text, region && region !== OTHER ? region : null)
      onChecked({ ...res, checkedAt: new Date().toISOString() })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container page">
      <Steps current={1} />
      {/* Same layout as the Laporan page: title above, raised cards below with the panel on the right. */}
      <div className="stack-sm" style={{ gap: 6 }}>
        <h1 className="h1 balance" tabIndex={-1}>Tempel teks kontrakmu</h1>
        <p className="muted measure">Salin seluruh isi kontrak PKWT tanpa diringkas. CekPKWT membaca setiap klausul, dari jangka waktu sampai denda.</p>
      </div>
      <div className="two-col">
        <div className="main stack-lg" style={{ gap: 24 }}>
          <form className="card card-raised card-accent stack-lg" onSubmit={submit} noValidate aria-label="Periksa kontrak">
            <div className="field" onDrop={dropPdf}
              onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragging(true) } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false) }}>
              <div className="row-between" style={{ alignItems: 'baseline', gap: '4px 16px' }}>
                <label htmlFor="kontrak" className="label kicker-label">Teks kontrak</label>
                <span className="hint">{contract.length.toLocaleString('id-ID')} karakter</span>
              </div>
              <textarea id="kontrak" className={`textarea textarea-contract${dragging ? ' is-dragging' : ''}`} rows={16} spellCheck={false}
                value={contract} onChange={(e) => setContract(e.target.value)} maxLength={MAX_CHARS + 1000}
                placeholder="Tempel teks kontrak di sini, atau seret file PDF ke sini…" aria-invalid={!!error && !loading} />
              <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setContract(SAMPLE)}>Pakai contoh kontrak</button>
                <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={pickPdf} />
                <button type="button" className="btn btn-primary btn-sm" disabled={reading || loading} onClick={() => fileInput.current?.click()}>
                  <Icon name="upload" size={16} />{reading ? 'Membaca PDF…' : 'Unggah PDF'}
                </button>
              </div>
            </div>

            <div className="field" style={{ maxWidth: 420 }}>
              <label htmlFor="lokasi" className="label kicker-label">Lokasi kerja</label>
              <select id="lokasi" className="select" value={region} onChange={(e) => setRegion(e.target.value)} aria-describedby="lokasi-hint">
                <option value="">{detected ? `${detected} (Deteksi otomatis)` : '(Deteksi otomatis dari kontrak)'}</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                <option value={OTHER}>Lainnya (di luar daftar)</option>
              </select>
              <span id="lokasi-hint" className="hint">Dipakai untuk membandingkan upah dengan upah minimum 2026.</span>
              {region === OTHER && (
                <div className="notice-unchecked" role="status">
                  <Icon name="circleDashed" size={18} />
                  <span>Upah minimum untuk lokasi ini belum ada di basis data kami, jadi akan masuk ke bagian “Tidak dapat diperiksa”. Cek keputusan gubernur setempat atau tanyakan ke Disnaker.</span>
                </div>
              )}
            </div>

            {error && <div className="alert" role="alert"><Icon name="octagonAlert" />{error}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-highlight btn-lg" disabled={loading}>
                {loading ? 'Memeriksa…' : <>Periksa kontrak<Icon name="arrowRight" /></>}
              </button>
              {loading
                ? <Loading>Membaca setiap klausul dan mencocokkannya dengan pasal. Jangan tutup halaman ini.</Loading>
                : <span className="hint">Hasilnya bukan nasihat hukum. Untuk masalah serius, hubungi LBH atau Disnaker.</span>}
            </div>
          </form>

          <section className="card card-raised stack" aria-labelledby="preview-title">
            <div className="row-between" style={{ alignItems: 'center', gap: '8px 16px' }}>
              <h2 id="preview-title" className="card-title"><Icon name="eyeOff" />Yang dibaca AI</h2>
              {preview.count > 0 && (
                <span className="badge sev-ok"><Icon name="circleCheck" size={16} />{preview.count} data pribadi disamarkan</span>
              )}
            </div>
            <p className="small muted">Pratinjau: data pribadi diganti label sebelum teks dikirim ke model. Data perusahaan (PT, direktur, HRD) dibiarkan.</p>
            <div className="redaction" tabIndex={0} aria-label="Pratinjau teks setelah penyamaran">
              {preview.text || <span className="muted">Teks yang sudah disamarkan akan muncul di sini.</span>}
            </div>
          </section>
        </div>

        <aside className="aside" aria-label="Tentang datamu">
          <section className="card-dark" aria-labelledby="data-title">
            <h2 id="data-title" className="card-title panel-title"><span style={{ color: 'var(--color-accent)', display: 'inline-flex' }}><Icon name="lock" /></span>Yang terjadi pada datamu</h2>
            <ul className="stack small" style={{ listStyle: 'none', padding: 0 }}>
              <li className="stack-sm" style={{ gap: 2 }}><strong>Disamarkan sebelum dibaca AI</strong>NIK, NPWP, email, telepon, nomor rekening, serta baris nama, alamat, dan tempat/tanggal lahir.</li>
              <li className="stack-sm" style={{ gap: 2 }}><strong>Kontrakmu tidak disimpan</strong>Teks kontrak tidak masuk ke basis data kami. Laporannya disimpan sementara di browser ini selama {TTL_MINUTES} menit, lalu terhapus.</li>
              <li className="stack-sm" style={{ gap: 2 }}><strong>Kontrak dibaca sebagai data</strong>Kalimat di dalam kontrak yang mencoba memberi perintah ke AI tidak dijalankan dan dilaporkan di bagian Catatan.</li>
            </ul>
          </section>
          <section className="card card-raised stack" aria-labelledby="cakupan-title">
            <h2 id="cakupan-title" className="card-title panel-title">Cakupan pemeriksaan</h2>
            <p className="small muted">Hanya kontrak <strong>PKWT</strong>. Kontrak PKWTT, magang, outsourcing, dan kemitraan belum bisa diperiksa.</p>
            <ul className="chips">{TOPICS.map((t) => <li key={t} className="tag">{t}</li>)}</ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

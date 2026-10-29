import { useEffect, useState, type FormEvent } from 'react'
import { checkContract, getRegions, type CheckResult } from '../api'
import { Icon, Loading, Steps } from '../components'
import { redact } from '../redact'
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

export default function Check({ onChecked }: { onChecked: (result: CheckResult) => void }) {
  const [contract, setContract] = useState('')
  const [region, setRegion] = useState('')
  const [regions, setRegions] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const preview = redact(contract)

  useEffect(() => {
    getRegions().then(setRegions).catch(() => setRegions([]))
  }, [])

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
      <div className="two-col">
        <div className="main stack-lg" style={{ gap: 24 }}>
          <form className="card stack-lg" onSubmit={submit} noValidate>
            <div className="stack-sm">
              <h1 className="h1" tabIndex={-1}>Tempel teks kontrakmu</h1>
              <p className="muted measure">Salin seluruh isi kontrak PKWT tanpa diringkas. CekPKWT membaca setiap klausul, dari jangka waktu sampai denda.</p>
            </div>

            <div className="field">
              <div className="row-between" style={{ alignItems: 'baseline', gap: '4px 16px' }}>
                <label htmlFor="kontrak" className="label">Teks kontrak</label>
                <span className="hint">{contract.length.toLocaleString('id-ID')} karakter</span>
              </div>
              <textarea id="kontrak" className="textarea textarea-contract" rows={16} spellCheck={false}
                value={contract} onChange={(e) => setContract(e.target.value)} maxLength={MAX_CHARS + 1000}
                placeholder="Tempel teks kontrak di sini…" aria-describedby="kontrak-hint" aria-invalid={!!error && !loading} />
              <div className="row-between" style={{ alignItems: 'center', gap: '8px 16px' }}>
                <span id="kontrak-hint" className="hint">Termasuk lampiran, kalau ada. PDF atau foto perlu disalin jadi teks dulu.</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setContract(SAMPLE)}>Pakai contoh kontrak</button>
              </div>
            </div>

            <div className="field" style={{ maxWidth: 420 }}>
              <label htmlFor="lokasi" className="label">Lokasi kerja</label>
              <select id="lokasi" className="select" value={region} onChange={(e) => setRegion(e.target.value)} aria-describedby="lokasi-hint">
                <option value="">Deteksi otomatis dari kontrak</option>
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

          <section className="card stack" aria-labelledby="preview-title">
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
            <h2 id="data-title" className="card-title"><span style={{ color: 'var(--color-accent)', display: 'inline-flex' }}><Icon name="lock" /></span>Yang terjadi pada datamu</h2>
            <ul className="stack small" style={{ listStyle: 'none', padding: 0 }}>
              <li className="stack-sm" style={{ gap: 2 }}><strong>Disamarkan sebelum dibaca AI</strong>NIK, NPWP, email, telepon, nomor rekening, serta baris nama, alamat, dan tempat/tanggal lahir.</li>
              <li className="stack-sm" style={{ gap: 2 }}><strong>Kontrakmu tidak disimpan</strong>Teks kontrak tidak masuk ke basis data kami. Laporannya disimpan sementara di browser ini selama {TTL_MINUTES} menit, lalu terhapus.</li>
              <li className="stack-sm" style={{ gap: 2 }}><strong>Kontrak dibaca sebagai data</strong>Kalimat di dalam kontrak yang mencoba memberi perintah ke AI tidak dijalankan dan dilaporkan di bagian Catatan.</li>
            </ul>
          </section>
          <section className="card stack" aria-labelledby="cakupan-title">
            <h2 id="cakupan-title" className="card-title">Cakupan pemeriksaan</h2>
            <p className="small muted">Hanya kontrak <strong>PKWT</strong>. Kontrak PKWTT, magang, outsourcing, dan kemitraan belum bisa diperiksa.</p>
            <ul className="chips">{TOPICS.map((t) => <li key={t} className="tag">{t}</li>)}</ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

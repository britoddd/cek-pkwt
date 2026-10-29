import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Reference, Severity } from '../api'
import { Citation, Icon, SeverityBadge, type IconName } from '../components'

// Demo findings, in contract order. Every rule and citation is a real corpus entry (data/labor_corpus.csv).
const FINDINGS: { clause: string; chip: string; severity: Severity; note: string; cite: Reference }[] = [
  {
    clause: 'Pasal 3 · Jangka Waktu', chip: 'Perpanjangan', severity: 'rendah',
    note: 'Perlu diperjelas: batas perpanjangannya tidak disebut. PKWT beserta perpanjangannya paling lama 5 tahun.',
    cite: { label: 'PP 35/2021 · Pasal 8', status: 'berlaku' },
  },
  {
    clause: 'Pasal 4 · Masa Percobaan', chip: 'Percobaan', severity: 'tinggi',
    note: 'Mungkin bertentangan dengan aturan: PKWT tidak dapat mensyaratkan masa percobaan. Kalau tetap disyaratkan, masa percobaannya batal demi hukum.',
    cite: { label: 'PP 35/2021 · Pasal 12', status: 'berlaku' },
  },
  {
    clause: 'Pasal 6 · Waktu Kerja', chip: 'Lembur', severity: 'sedang',
    note: 'Mungkin bertentangan dengan aturan: kerja melebihi jam kerja wajib dibayar upah lembur, kecuali untuk golongan jabatan tertentu.',
    cite: { label: 'PP 35/2021 · Pasal 27', status: 'berlaku' },
  },
]

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function useInView<T extends Element>(once = false) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      if (once && e.isIntersecting) io.disconnect()
    }, { threshold: 0.3 })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [once])
  return [ref, inView] as const
}

// Counts up once on first sight; screen readers get the final number straight away.
function CountUp({ to }: { to: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>(true)
  const [n, setN] = useState(() => (reducedMotion() ? to : 0))
  useEffect(() => {
    if (!inView || reducedMotion()) return
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / 900, 1)
      setN(Math.round(to * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [inView, to])
  return <><span ref={ref} aria-hidden="true">{n}</span><span className="sr-only">{to}</span></>
}

// The hero's contract plays the product once when first seen: personal data is hidden, the clauses are
// scanned, then the findings take turns. The turn timer is the active chip's progress bar (index.css),
// so pausing it on hover, keyboard focus, off-screen or the pause button needs no JS timer.
function ContractDemo() {
  const [ref, inView] = useInView<HTMLElement>()
  const [phase, setPhase] = useState<'idle' | 'redact' | 'scan' | 'done'>(() => (reducedMotion() ? 'done' : 'idle'))
  const [active, setActive] = useState(1)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (phase === 'idle' && inView) setPhase('redact')
    if (phase !== 'redact') return
    const t = setTimeout(() => setPhase('scan'), 900)
    return () => clearTimeout(t)
  }, [phase, inView])

  const done = phase === 'done'
  // Picking a finding takes over from the rotation until the reader presses play.
  const pick = (i: number) => { setActive(i); setPhase('done'); setPaused(true) }
  const clause = (i: number | null, title: string, body: ReactNode) => (
    <div className={done && i === active ? 'clause is-active' : 'clause'} data-severity={i === null ? undefined : FINDINGS[i].severity}>
      <p><strong>{title}</strong></p>
      <p>{body}</p>
    </div>
  )
  const flag = (i: number, text: string) => <mark className={done && i === active ? 'sweep is-on' : 'sweep'}>{text}</mark>
  const pii = (raw: string, token: string) => (phase === 'idle' ? raw : <span className="pii pii-in">{token}</span>)

  return (
    <figure ref={ref} className={`doc demo${done ? ' is-done' : ''}${paused || !inView ? ' is-paused' : ''}`}
      aria-label="Contoh: CekPKWT menyamarkan data pribadi, lalu menandai tiga klausul pada draf kontrak PKWT beserta pasal rujukannya">
      <div className="doc-head">
        <div>
          <strong>Perjanjian Kerja Waktu Tertentu</strong>
          <span className="mono muted small">Draf · belum ditandatangani</span>
        </div>
        <button type="button" className="demo-pause" onClick={() => setPaused(!paused)}
          aria-label={paused ? 'Putar contoh' : 'Jeda contoh'} title={paused ? 'Putar contoh' : 'Jeda contoh'}>
          <Icon name={paused ? 'play' : 'pause'} size={16} />
        </button>
      </div>
      <div className="doc-clauses">
        {clause(0, 'Pasal 3 · Jangka Waktu', <>Berlaku 12 (dua belas) bulan, {flag(0, 'dapat diperpanjang.')}</>)}
        {clause(1, 'Pasal 4 · Masa Percobaan', flag(1, 'Karyawan menjalani masa percobaan selama 3 (tiga) bulan.'))}
        {clause(null, 'Pasal 5 · Upah', <>Dibayar setiap tanggal 25 ke rekening {pii('0123 4567 89', '[NO_REKENING]')} atas nama {pii('Rina Wulandari', '[NAMA]')}.</>)}
        {clause(2, 'Pasal 6 · Waktu Kerja', flag(2, 'Karyawan bersedia bekerja lembur tanpa upah tambahan.'))}
        {phase === 'scan' && <span className="doc-scan" aria-hidden="true"><span onAnimationEnd={() => setPhase('done')} /></span>}
      </div>
      <div className="doc-note">
        <div className="demo-tabs" role="group" aria-label="Pilih temuan contoh">
          {FINDINGS.map((f, i) => (
            <button key={f.chip} type="button" className="demo-chip" aria-pressed={done && i === active} onClick={() => pick(i)}>
              <span className="toc-dot" data-severity={f.severity} aria-hidden="true" />
              {f.chip}
              {done && i === active && (
                <span className="demo-progress" aria-hidden="true" onAnimationEnd={() => setActive((i + 1) % FINDINGS.length)} />
              )}
            </button>
          ))}
        </div>
        <div className="demo-notes">
          <p className={done ? 'loading' : 'loading is-shown'}>
            <span className="marker-bar" aria-hidden="true" />
            {phase === 'scan' ? 'Mencocokkan klausul dengan 64 pasal…' : 'Menyamarkan data pribadi…'}
          </p>
          {FINDINGS.map((f, i) => (
            <div key={f.chip} className={done && i === active ? 'demo-note is-shown' : 'demo-note'}>
              <div className="row"><strong>{f.clause}</strong><SeverityBadge level={f.severity} /></div>
              <span>{f.note}</span>
              <Citation {...f.cite} />
            </div>
          ))}
        </div>
      </div>
      <div className="signatures">
        <div>
          <span style={{ height: 40 }} />
          <span className="sign-line" />
          <span>Pihak Pertama</span>
        </div>
        <div>
          <svg aria-hidden="true" width="40" height="40" viewBox="0 0 64 64" fill="none">
            <path className="sign-check" pathLength={1} d="M17 30.5 L27.5 41 L47 19.5" stroke="var(--primitive-color-stabilo-500)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sign-line ready" />
          <strong style={{ color: 'var(--color-primary)' }}>Pihak Kedua · tanda tangan setelah dicek</strong>
        </div>
      </div>
    </figure>
  )
}

const PROBLEMS = [
  ['Aturannya tersebar', 'Di UU Ketenagakerjaan dan perubahannya, peraturan pemerintah, keputusan upah minimum daerah, sampai putusan Mahkamah Konstitusi.'],
  ['Aturannya sedang berubah', 'UU Ketenagakerjaan baru sedang dibahas. Pasal yang kamu temukan di internet bisa saja sudah diubah atau dimaknai ulang.'],
  ['Bertanya terasa canggung', 'Pengacara terlalu mahal untuk pekerja baru, dan bertanya ke HR terasa berisiko saat tawaran kerja belum resmi.'],
]

const STEPS = [
  ['Tempel teks kontrak', 'Salin seluruh isi kontrak PKWT, tanpa diringkas. NIK, nomor rekening, alamat, dan data pribadi lain disamarkan sebelum dibaca AI.'],
  ['Baca laporannya', 'Setiap klausul dicocokkan dengan pasal dari basis regulasi resmi. Temuan diberi tingkat keparahan, tingkat keyakinan, dan pasal rujukan.'],
  ['Tanyakan ke HR dengan sopan', 'Temuan diubah jadi pertanyaan yang tidak menuduh. Kamu yang meninjau dan mengirimnya.'],
]

const PRINCIPLES: [IconName, string, string, string][] = [
  ['book', 'Berbasis pasal', 'Setiap temuan menunjuk ke pasal yang nyata, lengkap dengan status berlakunya dan rezim aturan yang dipakai.', '64 pasal dan ketentuan · sumber resmi tercatat'],
  ['circleDashed', 'Jujur soal batas', 'Kalau sebuah klausul tidak bisa diperiksa, CekPKWT bilang begitu. Tidak ada pasal, angka, atau akibat hukum yang dikarang.', 'Bagian khusus: Tidak dapat diperiksa'],
  ['eyeOff', 'Privasi dulu', 'NIK, NPWP, email, telepon, rekening, nama, alamat, dan tempat/tanggal lahir disamarkan sebelum diproses. Kontrakmu tidak disimpan.', '[NIK] [NAMA] [ALAMAT] [NO_REKENING]'],
  ['pen', 'Kendali di tanganmu', 'CekPKWT tidak pernah mengirim email. Kamu yang meninjau, mengedit, dan memutuskan kapan mengirim.', 'Hanya draf · tidak pernah terkirim otomatis'],
]

const LIMITS = [
  <>Hanya kontrak <strong>PKWT</strong>. PKWTT, magang, outsourcing, dan kemitraan belum bisa diperiksa.</>,
  <>Upah minimum 2026 baru tersedia untuk <strong>18 wilayah</strong> di Pulau Jawa, termasuk DKI Jakarta.</>,
  <>Basis regulasi berisi <strong>64 pasal</strong> dari aturan yang berlaku saat ini. UU Ketenagakerjaan baru belum tercakup.</>,
  <>Input berupa <strong>teks</strong>. Kontrak dalam bentuk PDF atau foto perlu disalin dulu.</>,
]

export default function Home() {
  // Sections below the hero fade up once as they scroll into view (index.css; instant with reduced motion).
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    }, { rootMargin: '0px 0px -8% 0px' })
    document.querySelectorAll('main .reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <section className="container hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="pill">Untuk fresh graduate · Kontrak PKWT</span>
          <h1 id="hero-title" className="hero-title" tabIndex={-1}><mark>Cek dulu</mark>, baru tanda tangan.</h1>
          <p className="lead measure">
            CekPKWT memeriksa kontrak PKWT pertamamu sebelum kamu tanda tangan. Tempel teks kontraknya, lalu CekPKWT
            menandai klausul yang mungkin bertentangan dengan aturan, lengkap dengan pasal rujukan, status berlakunya,
            dan pertanyaan sopan untuk HR.
          </p>
          <div className="row">
            <a href="#/cek" className="btn btn-highlight btn-lg">Tempel kontrakmu<Icon name="arrowRight" /></a>
            <a href="#/tanya" className="btn btn-secondary btn-lg">Tanya soal aturan</a>
          </div>
          <ul className="trust">
            <li><Icon name="lock" size={18} />Data pribadi disamarkan otomatis</li>
            <li><Icon name="book" size={18} />Setiap temuan ada pasalnya</li>
            <li><Icon name="pen" size={18} />Kamu yang memutuskan kirim ke HR</li>
          </ul>
        </div>

        <ContractDemo />

        <ul className="stats" aria-label="CekPKWT dalam angka">
          <li><span className="stat-num"><CountUp to={64} /></span>pasal dan ketentuan dari sumber resmi</li>
          <li><span className="stat-num"><CountUp to={18} /></span>wilayah dengan upah minimum 2026</li>
          <li><span className="stat-num"><CountUp to={8} /></span>jenis data pribadi disamarkan</li>
          <li><span className="stat-num">0</span>email yang dikirim otomatis</li>
        </ul>
      </section>

      <section className="band" aria-labelledby="masalah-title">
        <div className="container section">
          <div className="stack measure reveal">
            <p className="eyebrow">Kenapa perlu dicek</p>
            <h2 id="masalah-title" className="h2">Kerugiannya baru terasa setelah tanda tangan.</h2>
            <p className="lead muted">
              Masa percobaan pada PKWT, upah di bawah upah minimum, denda kalau resign lebih awal. Klausul seperti ini
              sering lolos karena kontrak pertama biasanya ditandatangani dengan cepat.
            </p>
          </div>
          <div className="grid">
            {PROBLEMS.map(([title, text], i) => (
              <div key={title} className="point reveal">
                <span className="num">0{i + 1}</span>
                <h3 className="h3">{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="container section" aria-labelledby="cara-title">
        <div className="stack measure reveal">
          <p className="eyebrow">Cara kerja</p>
          <h2 id="cara-title" className="h2">Tiga langkah sebelum tanda tangan</h2>
        </div>
        <ol className="grid">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="card step-card reveal">
              <span className={`step-dot${i === 2 ? ' accent' : ''}`} aria-hidden="true">{i + 1}</span>
              <h3 className="h3">{title}</h3>
              <p className="muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="prinsip" className="band" aria-labelledby="prinsip-title">
        <div className="container section">
          <div className="stack measure reveal">
            <p className="eyebrow">Prinsip</p>
            <h2 id="prinsip-title" className="h2">Berpihak padamu, berpegang pada pasal</h2>
          </div>
          <div className="grid">
            {PRINCIPLES.map(([icon, title, text, proof]) => (
              <div key={title} className="card stack reveal">
                <span className="icon-tile" aria-hidden="true"><Icon name={icon} size={22} /></span>
                <h3 className="h3">{title}</h3>
                <p className="muted">{text}</p>
                <p className="proof">{proof}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="batasan" className="container section" aria-labelledby="batasan-title">
        <div className="card-sunken limits reveal">
          <div className="stack">
            <p className="eyebrow">Batasan</p>
            <h2 id="batasan-title" className="h2">Yang belum bisa kami periksa</h2>
            <p className="muted">Lebih baik jujur sejak awal. Untuk hal di luar daftar ini, tanyakan ke Disnaker atau LBH setempat.</p>
          </div>
          <ul>
            {LIMITS.map((text, i) => <li key={i}><Icon name="circleDashed" size={22} /><span>{text}</span></li>)}
          </ul>
        </div>
      </section>
    </>
  )
}

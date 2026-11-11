import { useEffect, useState } from 'react'
import { getRegions, type Finding } from '../api'
import { Icon, type IconName } from '../components'
import { FindingCard } from './Report'

const EXAMPLE_CHIPS: [string, IconName, string][] = [
  ['sev-tinggi', 'octagonAlert', '1 Tinggi'],
  ['sev-sedang', 'triangleAlert', '1 Sedang'],
  ['sev-ok', 'circleCheck', '6 Tanpa masalah'],
  ['sev-unchecked', 'circleDashed', '1 Tidak dapat diperiksa'],
]

const EXAMPLE_FINDING: Finding = {
  title: 'Masa percobaan dalam PKWT',
  quote: 'Karyawan menjalani masa percobaan selama 3 (tiga) bulan.',
  issue: 'PKWT tidak dapat mensyaratkan masa percobaan. Jika tetap disyaratkan, masa percobaan itu batal demi hukum dan masa kerja tetap dihitung.',
  references: [{ label: 'PP 35/2021 Pasal 12', status: 'berlaku', regulation: 'PP 35/2021', article: 'Pasal 12', topic: 'Masa percobaan', text: '(1) PKWT tidak dapat mensyaratkan adanya masa percobaan kerja. (2) Dalam hal disyaratkan masa percobaan kerja, masa percobaan kerja yang disyaratkan tersebut batal demi hukum dan masa kerja tetap dihitung.', url: 'https://peraturan.bpk.go.id/Download/154582/PP%20Nomor%2035%20Tahun%202021.pdf' }],
  severity: 'tinggi',
  confidence: 'tinggi',
  hr_question: 'Apakah masa percobaan 3 bulan di Pasal 4 bisa dihapus, karena kontrak ini PKWT?',
}

const PROBLEMS = [
  ['Aturannya tersebar', 'Di UU Ketenagakerjaan dan perubahannya, peraturan pemerintah, keputusan upah minimum daerah, sampai putusan Mahkamah Konstitusi.'],
  ['Aturannya sedang berubah', 'UU Pelindungan Ketenagakerjaan baru disahkan DPR pada Oktober 2026, dan aturan turunannya terus terbit. Pasal yang kamu temukan di internet bisa saja sudah diubah atau dimaknai ulang.'],
  ['Bertanya terasa canggung', 'Pengacara terlalu mahal untuk pekerja baru, dan bertanya ke HR terasa berisiko saat tawaran kerja belum resmi.'],
]

const STEPS = [
  ['Tempel teks kontrak', 'Salin seluruh isi kontrak PKWT, tanpa diringkas. NIK, nomor rekening, alamat, dan data pribadi lain disamarkan sebelum dibaca AI.'],
  ['Baca laporannya', 'Setiap klausul dicocokkan dengan pasal dari basis regulasi resmi. Temuan diberi tingkat keparahan, tingkat keyakinan, dan pasal rujukan.'],
  ['Tanyakan ke HR dengan sopan', 'Temuan diubah jadi pertanyaan yang tidak menuduh. Kamu yang meninjau dan mengirimnya.'],
]

const PRINCIPLES: [IconName, string, string, string][] = [
  ['book', 'Berbasis pasal', 'Setiap temuan menunjuk ke pasal yang nyata, lengkap dengan status berlakunya dan rezim aturan yang dipakai.', 'Sumber resmi tercatat · dicek ke situs pemerintah setiap hari'],
  ['circleDashed', 'Jujur soal batas', 'Kalau sebuah klausul tidak bisa diperiksa, CekPKWT bilang begitu. Tidak ada pasal, angka, atau akibat hukum yang dikarang.', 'Bagian khusus: Tidak dapat diperiksa'],
  ['eyeOff', 'Privasi dulu', 'NIK, NPWP, email, telepon, rekening, nama, alamat, dan tempat/tanggal lahir disamarkan sebelum diproses. Kontrakmu tidak disimpan.', '[NIK] [NAMA] [ALAMAT] [NO_REKENING]'],
  ['pen', 'Kendali di tanganmu', 'CekPKWT tidak pernah mengirim email. Kamu yang meninjau, mengedit, dan memutuskan kapan mengirim.', 'Hanya draf · tidak pernah terkirim otomatis'],
]

// The region count comes from the corpus via /api/regions, so it follows the daily sync.
const limits = (regionCount: number) => [
  <>Hanya kontrak <strong>PKWT</strong>. PKWTT, magang, outsourcing, dan kemitraan belum bisa diperiksa.</>,
  <>Upah minimum baru tersedia untuk <strong>{regionCount ? `${regionCount} wilayah` : 'sebagian wilayah'}</strong> di Pulau Jawa, termasuk DKI Jakarta.</>,
  <>Kontrak dinilai dengan <strong>aturan yang berlaku saat ini</strong>. UU Pelindungan Ketenagakerjaan yang baru disahkan belum dipakai untuk menilai.</>,
  <>Input berupa <strong>teks</strong>. Kontrak dalam bentuk PDF atau foto perlu disalin dulu.</>,
]

export default function Home() {
  const [regionCount, setRegionCount] = useState(0)
  useEffect(() => { getRegions().then((r) => setRegionCount(r.length)).catch(() => {}) }, [])

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

        {/* A miniature of the real report page, built from its own components so the two never drift apart. */}
        <figure className="hero-report" aria-label="Contoh laporan: klausul masa percobaan ditandai sebagai potensi masalah">
          <div className="card report-summary stack">
            <p className="small muted">Contoh laporan pemeriksaan kontrak</p>
            <p className="summary-lead">Ditemukan <mark>2 potensi masalah</mark> (1 tinggi, 1 sedang).</p>
            <ul className="chips">
              {EXAMPLE_CHIPS.map(([cls, icon, text]) => (
                <li key={text}><span className={`badge badge-lg ${cls}`}><Icon name={icon} size={16} />{text}</span></li>
              ))}
            </ul>
          </div>
          <FindingCard finding={EXAMPLE_FINDING} index={1} defaultOpen={false} example />
        </figure>
      </section>

      <section className="band" aria-labelledby="masalah-title">
        <div className="container section">
          <div className="stack measure">
            <p className="eyebrow">Kenapa perlu dicek</p>
            <h2 id="masalah-title" className="h2">Kerugiannya baru terasa setelah tanda tangan.</h2>
            <p className="lead muted">
              Masa percobaan pada PKWT, upah di bawah upah minimum, denda kalau resign lebih awal. Klausul seperti ini
              sering lolos karena kontrak pertama biasanya ditandatangani dengan cepat.
            </p>
          </div>
          <div className="grid">
            {PROBLEMS.map(([title, text], i) => (
              <div key={title} className="point">
                <span className="num">0{i + 1}</span>
                <h3 className="h3">{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="container section" aria-labelledby="cara-title">
        <div className="stack measure">
          <p className="eyebrow">Cara kerja</p>
          <h2 id="cara-title" className="h2">Tiga langkah sebelum tanda tangan</h2>
        </div>
        <ol className="grid">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="card card-raised step-card">
              <span className={`step-dot${i === 2 ? ' accent' : ''}`} aria-hidden="true">{i + 1}</span>
              <h3 className="h3">{title}</h3>
              <p className="muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="prinsip" className="band" aria-labelledby="prinsip-title">
        <div className="container section">
          <div className="stack measure">
            <p className="eyebrow">Prinsip</p>
            <h2 id="prinsip-title" className="h2">Berpihak padamu, berpegang pada pasal</h2>
          </div>
          <div className="grid">
            {PRINCIPLES.map(([icon, title, text, proof]) => (
              <div key={title} className="card card-raised stack">
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
        <div className="card-sunken limits">
          <div className="stack">
            <p className="eyebrow">Batasan</p>
            <h2 id="batasan-title" className="h2">Yang belum bisa kami periksa</h2>
            <p className="muted">Lebih baik jujur sejak awal. Untuk hal di luar daftar ini, tanyakan ke Disnaker atau LBH setempat.</p>
          </div>
          <ul>
            {limits(regionCount).map((text, i) => <li key={i}><Icon name="circleDashed" size={22} /><span>{text}</span></li>)}
          </ul>
        </div>
      </section>
    </>
  )
}

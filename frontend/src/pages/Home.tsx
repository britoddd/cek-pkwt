import { Citation, Icon, SeverityBadge, type IconName } from '../components'

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

        <figure className="doc" aria-label="Contoh: klausul masa percobaan pada draf kontrak ditandai sebagai potensi masalah">
          <div className="doc-head">
            <strong>Perjanjian Kerja Waktu Tertentu</strong>
            <span className="mono muted small">Draf · belum ditandatangani</span>
          </div>
          <div>
            <p><strong>Pasal 3 · Jangka Waktu</strong></p>
            <p>Perjanjian ini berlaku selama 12 (dua belas) bulan terhitung sejak tanggal mulai bekerja.</p>
          </div>
          <div>
            <p><strong>Pasal 4 · Masa Percobaan</strong></p>
            <p><mark>Karyawan menjalani masa percobaan selama 3 (tiga) bulan.</mark></p>
          </div>
          <div className="doc-note">
            <SeverityBadge level="tinggi" />
            <span>Mungkin bertentangan dengan aturan: PKWT tidak dapat mensyaratkan masa percobaan.</span>
            <Citation label="PP 35/2021 · Pasal 12" status="berlaku" />
          </div>
          <div>
            <p><strong>Pasal 5 · Upah</strong></p>
            <p>Upah dibayarkan setiap tanggal 25 melalui transfer ke rekening <span className="pii">[NO_REKENING]</span> atas nama <span className="pii">[NAMA]</span>.</p>
          </div>
          <div className="signatures">
            <div>
              <span style={{ height: 40 }} />
              <span className="sign-line" />
              <span>Pihak Pertama</span>
            </div>
            <div>
              <svg aria-hidden="true" width="40" height="40" viewBox="0 0 64 64" fill="none">
                <path d="M17 30.5 L27.5 41 L47 19.5" stroke="var(--primitive-color-stabilo-500)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sign-line ready" />
              <strong style={{ color: 'var(--color-primary)' }}>Pihak Kedua · tanda tangan setelah dicek</strong>
            </div>
          </div>
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
            <li key={title} className="card step-card">
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
              <div key={title} className="card stack">
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
            {LIMITS.map((text, i) => <li key={i}><Icon name="circleDashed" size={22} /><span>{text}</span></li>)}
          </ul>
        </div>
      </section>
    </>
  )
}

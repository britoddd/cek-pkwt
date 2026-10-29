import type { CheckResult, Finding, Severity } from '../api'
import { Citation, CitedText, CopyButton, EmptyState, Icon, Paragraphs, SeverityBadge, Steps, type IconName } from '../components'

const LEVELS: { level: Severity; label: string; icon: IconName }[] = [
  { level: 'tinggi', label: 'Tinggi', icon: 'octagonAlert' },
  { level: 'sedang', label: 'Sedang', icon: 'triangleAlert' },
  { level: 'rendah', label: 'Rendah', icon: 'info' },
]

// Hash links would change the route, so section jumps scroll and move focus by hand.
function jumpTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  el.focus({ preventScroll: true })
}

const questionsText = (findings: Finding[]) =>
  ['Pertanyaan terkait draf kontrak PKWT:', ...findings.map((f, i) => `${i + 1}. ${f.hr_question}`)].join('\n')

export default function Report({ result }: { result: CheckResult | null }) {
  if (!result) {
    return (
      <EmptyState title="Belum ada laporan">
        <p className="muted">Laporan tidak disimpan, jadi hilang saat halaman dimuat ulang. Tempel kontrakmu untuk memulai pemeriksaan.</p>
        <a href="#/cek" className="btn btn-highlight btn-lg" style={{ alignSelf: 'flex-start' }}>Tempel kontrakmu<Icon name="arrowRight" /></a>
      </EmptyState>
    )
  }

  const { report } = result
  const checkedAt = result.checkedAt.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const header = (
    <div className="row-between">
      <div className="stack-sm" style={{ gap: 6 }}>
        <p className="small muted">Diperiksa {checkedAt}</p>
        <h1 className="h1 balance" tabIndex={-1}>{report ? 'Laporan pemeriksaan kontrak' : 'Hasil pemeriksaan'}</h1>
      </div>
      <a href="#/cek" className="btn btn-secondary no-print">Cek kontrak lain</a>
    </div>
  )

  // The model answered outside the report format (e.g. not a PKWT): show its text as is.
  if (!report) {
    return (
      <div className="container page">
        <Steps current={2} />
        {header}
        <div className="card stack measure"><Paragraphs text={result.markdown} /></div>
      </div>
    )
  }

  const regimeAt = report.summary.search(/rezim aturan\s*:/i)
  const lead = regimeAt >= 0 ? report.summary.slice(0, regimeAt).trim() : report.summary
  const regime = regimeAt >= 0 ? report.summary.slice(regimeAt).replace(/^rezim aturan\s*:\s*/i, '') : ''
  const findings = report.findings // sorted most severe first by the backend
  const questions = findings.filter((f) => f.hr_question)

  const jumps = [
    ...LEVELS.map(({ level, label, icon }) => ({
      key: level, cls: `sev-${level}`, icon, label,
      count: findings.filter((f) => f.severity === level).length,
      target: `temuan-${findings.findIndex((f) => f.severity === level) + 1}`,
    })),
    { key: 'ok', cls: 'sev-ok', icon: 'circleCheck' as IconName, label: 'Tanpa masalah', count: report.no_issues.length, target: 'bagian-aman' },
    { key: 'unchecked', cls: 'sev-unchecked', icon: 'circleDashed' as IconName, label: 'Tidak dapat diperiksa', count: report.unchecked.length, target: 'bagian-tidak' },
  ].filter((j) => j.count > 0)

  return (
    <div className="container page">
      <Steps current={2} />
      <section className="stack-lg" aria-label="Ringkasan">
        {header}
        <div className="card stack-lg">
          <p className="summary-lead">
            {lead.split(/(\d+ potensi masalah)/i).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <CitedText key={i} text={part} />))}
          </p>

          {jumps.length > 0 && (
            <ul className="chips" aria-label="Lompat ke bagian laporan">
              {jumps.map((j) => (
                <li key={j.key}>
                  <button type="button" className={`badge badge-lg badge-btn ${j.cls}`} onClick={() => jumpTo(j.target)}>
                    <Icon name={j.icon} size={16} />{j.count} {j.label}
                    <span className="sr-only">, lompat ke bagian ini</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="summary-actions no-print">
            <div className="row">
              {findings.length > 0 && <a href="#/email-hr" className="btn btn-highlight"><Icon name="mail" />Buat draf email ke HR</a>}
              {questions.length > 0 && <CopyButton text={questionsText(questions)} label="Salin semua pertanyaan" className="btn btn-secondary" />}
              <button type="button" className="btn btn-secondary" onClick={() => print()}><Icon name="download" size={18} />Simpan sebagai PDF</button>
            </div>
            <p className="hint">Laporan ini tidak kami simpan. Simpan sendiri sebelum menutup halaman.</p>
          </div>

          <div className="summary-notes">
            <details className="legend no-print">
              <summary>Apa arti keparahan, keyakinan, dan status pasal?</summary>
              <dl>
                <dt>Keparahan tinggi</dt>
                <dd>Berdampak langsung pada upah atau hak utama.</dd>
                <dt>Keparahan sedang dan rendah</dt>
                <dd>Dampaknya lebih kecil, tetapi tetap sebaiknya dikonfirmasi ke HR.</dd>
                <dt>Keyakinan</dt>
                <dd>Seberapa jelas dasarnya. Tinggi: klausul eksplisit dan pasalnya jelas. Sedang: perlu interpretasi. Rendah: klausulnya ambigu.</dd>
                <dt>Status pasal</dt>
                <dd>
                  <strong>berlaku</strong>: berlaku sebagaimana tertulis. <strong>diubah</strong> atau <strong>disisipkan</strong>: berlaku
                  dalam bentuk yang telah diubah atau disisipkan. <strong>dimaknai Putusan MK</strong>: dibaca sesuai pemaknaan Putusan
                  Mahkamah Konstitusi. <strong>imbauan</strong>: surat edaran, bukan peraturan yang memuat sanksi.
                </dd>
              </dl>
            </details>

            {regime && <p className="summary-regime"><strong style={{ color: 'var(--color-text)' }}>Rezim aturan:</strong> {regime}</p>}
          </div>
        </div>
      </section>

      <div className="two-col">
        <div className="main stack" style={{ gap: 40 }}>
          <section id="bagian-temuan" className="stack-lg jump-target" aria-labelledby="temuan-title" tabIndex={-1}>
            <h2 id="temuan-title" className="section-title">Potensi masalah ({findings.length})</h2>
            {findings.length === 0 ? (
              <p className="card row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-severity-ok)', display: 'inline-flex' }}><Icon name="circleCheck" /></span>
                <span>
                  Tidak ada potensi masalah yang ditemukan dari pasal di basis regulasi kami.
                  {report.unchecked.length > 0 && ' Tetap baca bagian “Tidak dapat diperiksa” di bawah.'}
                </span>
              </p>
            ) : findings.map((f, i) => <FindingCard key={i} finding={f} index={i + 1} />)}
          </section>

          {report.no_issues.length > 0 && (
            <section id="bagian-aman" className="stack jump-target" aria-labelledby="aman-title" tabIndex={-1}>
              <h2 id="aman-title" className="section-title">Klausul tanpa masalah yang ditemukan</h2>
              <ul className="check-list">
                {report.no_issues.map((item, i) => <li key={i}><Icon name="circleCheck" /><span><CitedText text={item} /></span></li>)}
              </ul>
            </section>
          )}

          {report.unchecked.length > 0 && (
            <section id="bagian-tidak" className="stack jump-target" aria-labelledby="tidak-title" tabIndex={-1}>
              <div className="stack-sm" style={{ gap: 4 }}>
                <h2 id="tidak-title" className="section-title">Tidak dapat diperiksa</h2>
                <p className="muted">Klausul ini tidak cocok dengan pasal mana pun di basis regulasi kami. Ini bukan berarti aman atau bermasalah.</p>
              </div>
              <ul className="unchecked-list">
                {report.unchecked.map((item, i) => <li key={i}><Icon name="circleDashed" /><span><CitedText text={item} /></span></li>)}
              </ul>
            </section>
          )}

          {report.notes.length > 0 && (
            <section id="bagian-catatan" className="stack-sm jump-target" aria-labelledby="catatan-title" tabIndex={-1}>
              <h2 id="catatan-title" className="card-title">Catatan</h2>
              {report.notes.map((note, i) => <p key={i} className="muted"><CitedText text={note} /></p>)}
            </section>
          )}

          <p className="disclaimer">
            {report.disclaimer || 'Ini bukan nasihat hukum. Hasil CekPKWT dibuat oleh AI dari basis regulasi yang terbatas dan bisa keliru. Untuk masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.'}
          </p>
        </div>

        <aside className="aside report-aside no-print" aria-label="Navigasi laporan">
          <nav className="card stack-sm toc" aria-labelledby="isi-title">
            <h2 id="isi-title" className="card-title" style={{ fontSize: 15 }}>Isi laporan</h2>
            <ul>
              {findings.map((f, i) => (
                <li key={i}>
                  <button type="button" className="toc-link" onClick={() => jumpTo(`temuan-${i + 1}`)}>
                    <span className="toc-dot" data-severity={f.severity ?? ''} aria-hidden="true" />
                    <span>{f.title}{f.severity && <span className="sr-only">, keparahan {f.severity}</span>}</span>
                  </button>
                </li>
              ))}
              {report.no_issues.length > 0 && <li><button type="button" className="toc-link" onClick={() => jumpTo('bagian-aman')}><span className="toc-dot" data-severity="ok" aria-hidden="true" />Tanpa masalah ({report.no_issues.length})</button></li>}
              {report.unchecked.length > 0 && <li><button type="button" className="toc-link" onClick={() => jumpTo('bagian-tidak')}><span className="toc-dot" data-severity="unchecked" aria-hidden="true" />Tidak dapat diperiksa ({report.unchecked.length})</button></li>}
              {report.notes.length > 0 && <li><button type="button" className="toc-link" onClick={() => jumpTo('bagian-catatan')}><span className="toc-dot" aria-hidden="true" />Catatan</button></li>}
            </ul>
          </nav>
          <section className="card-sunken stack-sm" aria-labelledby="bantuan-title">
            <h2 id="bantuan-title" className="card-title" style={{ fontSize: 15 }}>Masih ragu?</h2>
            <p className="small muted">Tanyakan aturannya, atau hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja di kota tempatmu bekerja.</p>
            <a href="#/tanya" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>Tanya soal aturan</a>
          </section>
        </aside>
      </div>
    </div>
  )
}

function FindingCard({ finding: f, index }: { finding: Finding; index: number }) {
  const missingQuote = !f.quote || /^tidak (disebutkan|ada)/i.test(f.quote)
  return (
    <article id={`temuan-${index}`} className="card finding jump-target" aria-labelledby={`temuan-${index}-judul`} tabIndex={-1}>
      <div className="finding-head">
        <h3 id={`temuan-${index}-judul`} className="finding-title balance">
          <span className="finding-num">{String(index).padStart(2, '0')}</span>{f.title}
        </h3>
        {f.severity && <SeverityBadge level={f.severity} />}
      </div>
      {missingQuote
        ? <p className="missing">Tidak disebutkan di kontrak.</p>
        : <blockquote className="quote"><mark>“{f.quote}”</mark></blockquote>}
      {f.issue && <p><strong>Potensi masalah:</strong> <CitedText text={f.issue} /></p>}
      {(f.references.length > 0 || f.confidence) && (
        <div className="meta-row">
          {f.references.map((r, i) => <Citation key={i} {...r} />)}
          {f.confidence && <span className="small muted">Keyakinan AI: <strong style={{ color: 'var(--color-text)' }}>{f.confidence}</strong></span>}
        </div>
      )}
      {f.hr_question && (
        <div className="hr-question">
          <div>
            <span className="kicker">Pertanyaan untuk HR</span>
            <span>{f.hr_question}</span>
          </div>
          <span className="no-print"><CopyButton text={f.hr_question} name={`Salin pertanyaan ${index}`} /></span>
        </div>
      )}
    </article>
  )
}

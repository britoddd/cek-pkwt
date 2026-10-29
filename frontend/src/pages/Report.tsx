import { useState } from 'react'
import type { CheckResult, Finding, Severity } from '../api'
import { Citation, CitedText, EmptyState, Icon, Paragraphs, SeverityBadge, Steps } from '../components'

const COUNTS: [Severity, string][] = [['tinggi', 'Tinggi'], ['sedang', 'Sedang'], ['rendah', 'Rendah']]

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
  const date = result.checkedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const header = (
    <div className="row-between">
      <div className="stack-sm" style={{ gap: 6 }}>
        <p className="mono small muted">check_work_contract · {date}</p>
        <h1 className="h1" tabIndex={-1}>{report ? 'Laporan pemeriksaan kontrak' : 'Hasil pemeriksaan'}</h1>
      </div>
      <a href="#/cek" className="btn btn-secondary">Cek kontrak lain</a>
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
  const findings = report.findings

  return (
    <div className="container page">
      <Steps current={2} />
      <section className="stack-lg" aria-label="Ringkasan">
        {header}
        <div className="card stack-lg">
          <p className="summary-lead">
            {lead.split(/(\d+ potensi masalah)/i).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <CitedText key={i} text={part} />))}
          </p>
          <ul className="chips" aria-label="Jumlah per kategori">
            {COUNTS.map(([level, label]) => (
              <li key={level} className={`badge badge-lg sev-${level}`}>
                <Icon name={level === 'tinggi' ? 'octagonAlert' : level === 'sedang' ? 'triangleAlert' : 'info'} size={16} />
                {findings.filter((f) => f.severity === level).length} {label}
              </li>
            ))}
            <li className="badge badge-lg sev-ok"><Icon name="circleCheck" size={16} />{report.no_issues.length} Tanpa masalah</li>
            <li className="badge badge-lg sev-unchecked"><Icon name="circleDashed" size={16} />{report.unchecked.length} Tidak dapat diperiksa</li>
          </ul>
          {regime && <p className="summary-regime"><strong style={{ color: 'var(--color-text)' }}>Rezim aturan:</strong> {regime}</p>}
        </div>
      </section>

      <div className="two-col">
        <div className="main stack" style={{ gap: 40 }}>
          <section className="stack-lg" aria-labelledby="temuan-title">
            <h2 id="temuan-title" className="section-title">Potensi masalah</h2>
            {findings.length === 0
              ? <p className="card muted">Tidak ada potensi masalah yang ditemukan dari pasal di basis regulasi kami.</p>
              : findings.map((f, i) => <FindingCard key={i} finding={f} index={i + 1} />)}
          </section>

          {report.no_issues.length > 0 && (
            <section className="stack" aria-labelledby="aman-title">
              <h2 id="aman-title" className="section-title">Klausul tanpa masalah yang ditemukan</h2>
              <ul className="check-list">
                {report.no_issues.map((item, i) => <li key={i}><Icon name="circleCheck" /><span><CitedText text={item} /></span></li>)}
              </ul>
            </section>
          )}

          {report.unchecked.length > 0 && (
            <section className="stack" aria-labelledby="tidak-title">
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
            <section className="stack-sm" aria-labelledby="catatan-title">
              <h2 id="catatan-title" className="card-title">Catatan</h2>
              {report.notes.map((note, i) => <p key={i} className="muted"><CitedText text={note} /></p>)}
            </section>
          )}

          <p className="disclaimer">
            {report.disclaimer || 'Ini bukan nasihat hukum. Hasil CekPKWT dibuat oleh AI dari basis regulasi yang terbatas dan bisa keliru. Untuk masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.'}
          </p>
        </div>

        <aside className="aside" aria-label="Langkah berikutnya">
          <section className="card-dark" aria-labelledby="next-title">
            <h2 id="next-title" className="card-title" style={{ fontSize: 20 }}>Langkah berikutnya</h2>
            {findings.length > 0 ? (
              <>
                <p>Ubah {findings.length} temuan ini jadi email sopan untuk HR. Kamu tinjau dan kirim sendiri.</p>
                <a href="#/email-hr" className="btn btn-highlight"><Icon name="mail" />Buat draf email ke HR</a>
              </>
            ) : (
              <p>Tidak ada temuan yang perlu ditanyakan ke HR. Tetap baca kontraknya dengan teliti sebelum tanda tangan.</p>
            )}
            <a href="#/tanya" className="btn btn-on-dark">Tanya soal aturan</a>
          </section>
          <section className="card-sunken stack-sm" aria-labelledby="bantuan-title">
            <h2 id="bantuan-title" className="card-title" style={{ fontSize: 15 }}>Butuh pendampingan?</h2>
            <p className="small muted">Untuk masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja di kota tempatmu bekerja.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function FindingCard({ finding: f, index }: { finding: Finding; index: number }) {
  const [copied, setCopied] = useState(false)
  const missingQuote = !f.quote || /^tidak (disebutkan|ada)/i.test(f.quote)
  const copy = () => navigator.clipboard?.writeText(f.hr_question).then(() => setCopied(true), () => {})

  return (
    <article className="card finding" aria-labelledby={`temuan-${index}`}>
      <div className="finding-head">
        <h3 id={`temuan-${index}`} className="finding-title">
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
          {f.confidence && <span className="small muted">Keyakinan: <strong style={{ color: 'var(--color-text)' }}>{f.confidence}</strong></span>}
        </div>
      )}
      {f.hr_question && (
        <div className="hr-question">
          <div>
            <span className="kicker">Pertanyaan untuk HR</span>
            <span>{f.hr_question}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={16} />{copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      )}
    </article>
  )
}

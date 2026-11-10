import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { CheckResult, Finding, Severity } from '../api'
import { Citation, CitedText, CopyButton, EmptyState, Icon, Paragraphs, SeverityBadge, Steps, type IconName } from '../components'
import { TTL_MINUTES } from '../storage'

const LEVELS: { level: Severity; label: string; icon: IconName }[] = [
  { level: 'tinggi', label: 'Tinggi', icon: 'octagonAlert' },
  { level: 'sedang', label: 'Sedang', icon: 'triangleAlert' },
  { level: 'rendah', label: 'Rendah', icon: 'info' },
]

const questionsText = (findings: Finding[]) =>
  ['Pertanyaan terkait draf kontrak PKWT:', ...findings.map((f, i) => `${i + 1}. ${f.hr_question}`)].join('\n')

export default function Report({ result, onClear }: { result: CheckResult | null; onClear: () => void }) {
  // Categories the reader has hidden (severity levels, 'ok', 'unchecked'). None hidden, i.e. every
  // checkbox ticked and every chip in colour, is the default and shows everything.
  const [hidden, setHidden] = useState<string[]>([])
  if (!result) {
    return (
      <EmptyState title="Belum ada laporan">
        <p className="muted">Laporan disimpan di browser ini sampai {TTL_MINUTES} menit setelah terakhir dibuka, lalu terhapus otomatis. Tempel kontrakmu untuk memulai pemeriksaan.</p>
        <a href="#/cek" className="btn btn-highlight btn-lg" style={{ alignSelf: 'flex-start' }}>Tempel kontrakmu<Icon name="arrowRight" /></a>
      </EmptyState>
    )
  }

  const { report } = result
  const checkedAt = new Date(result.checkedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  const chips = [
    ...LEVELS.map(({ level, label, icon }) => ({
      key: level as string, cls: `sev-${level}`, icon, label,
      count: findings.filter((f) => f.severity === level).length,
    })),
    { key: 'ok', cls: 'sev-ok', icon: 'circleCheck' as IconName, label: 'Tanpa masalah', count: report.no_issues.length },
    { key: 'unchecked', cls: 'sev-unchecked', icon: 'circleDashed' as IconName, label: 'Tidak dapat diperiksa', count: report.unchecked.length },
  ].filter((c) => c.count > 0)
  const toggle = (key: string) => setHidden((off) => (off.includes(key) ? off.filter((k) => k !== key) : [...off, key]))
  // A finding without a severity has no checkbox, so it only shows while nothing is hidden.
  const shows = (key: string | null) => hidden.length === 0 || (key !== null && !hidden.includes(key))
  const allHidden = chips.length > 0 && chips.every((c) => hidden.includes(c.key))
  // Summary chips: with everything showing, a click shows only that category. After that they toggle,
  // and clicking the last category still shown brings everything back. (The checkboxes simply toggle.)
  const chipClick = (key: string) => {
    const shown = chips.filter((c) => !hidden.includes(c.key))
    if (hidden.length === 0) setHidden(chips.map((c) => c.key).filter((k) => k !== key))
    else if (shown.length === 1 && shown[0].key === key) setHidden([])
    else toggle(key)
  }
  // Keep each finding's original number so its id, label and "Isi laporan" entry stay the same when filtered.
  const visible = findings.map((f, i) => ({ f, n: i + 1 })).filter(({ f }) => shows(f.severity))

  return (
    <div className="container page">
      <Steps current={2} />
      <section className="stack-lg" aria-label="Ringkasan">
        {header}
        <div className="card report-summary stack-lg">
          <p className="summary-lead">
            {lead.split(/(\d+ potensi masalah)/i).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <CitedText key={i} text={part} />))}
          </p>

          {chips.length > 0 && (
            <ul className="chips" aria-label="Saring laporan">
              {chips.map((c) => (
                <li key={c.key}>
                  <button type="button" className={`badge badge-lg badge-btn ${c.cls}`} aria-pressed={shows(c.key)} onClick={() => chipClick(c.key)}>
                    <Icon name={c.icon} size={16} />{c.count} {c.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="summary-notes">
            <details className="legend no-print">
              <summary>Apa arti keparahan dan keyakinan?</summary>
              <dl>
                <dt>Keparahan tinggi</dt>
                <dd>Berdampak langsung pada upah atau hak utama.</dd>
                <dt>Keparahan sedang dan rendah</dt>
                <dd>Dampaknya lebih kecil, tetapi tetap sebaiknya dikonfirmasi ke HR.</dd>
                <dt>Keyakinan</dt>
                <dd>Seberapa jelas dasarnya. Tinggi: klausul eksplisit dan pasalnya jelas. Sedang: perlu interpretasi. Rendah: klausulnya ambigu.</dd>
              </dl>
            </details>

            {regime && <p className="summary-regime"><strong style={{ color: 'var(--color-text)' }}>Rezim aturan:</strong> {regime}</p>}
          </div>
        </div>
      </section>

      <div className="two-col">
        <div className="main stack" style={{ gap: 40 }}>
          {allHidden && (
            <p className="card">
              Semua kategori sedang disembunyikan.{' '}
              <button type="button" className="link-btn" onClick={() => setHidden([])}>Tampilkan semua</button>
            </p>
          )}

          {(hidden.length === 0 || visible.length > 0) && <section id="bagian-temuan" className="stack-lg jump-target" aria-labelledby="temuan-title" tabIndex={-1}>
            <h2 id="temuan-title" className="section-title">
              Potensi masalah ({hidden.length > 0 ? `${visible.length} dari ${findings.length}` : findings.length})
            </h2>
            {findings.length === 0 ? (
              <p className="card row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-severity-ok)', display: 'inline-flex' }}><Icon name="circleCheck" /></span>
                <span>
                  Tidak ada potensi masalah yang ditemukan dari pasal di basis regulasi kami.
                  {report.unchecked.length > 0 && ' Tetap baca bagian “Tidak dapat diperiksa” di bawah.'}
                </span>
              </p>
            ) : visible.map(({ f, n }) => <FindingCard key={n} finding={f} index={n} />)}
          </section>}

          {report.no_issues.length > 0 && shows('ok') && (
            <section id="bagian-aman" className="stack jump-target" aria-labelledby="aman-title" tabIndex={-1}>
              <h2 id="aman-title" className="section-title title-icon title-ok"><Icon name="circleCheck" size={24} />Klausul tanpa masalah yang ditemukan</h2>
              <ul className="check-list">
                {report.no_issues.map((item, i) => <li key={i}><Icon name="circleCheck" /><span><CitedText text={item} /></span></li>)}
              </ul>
            </section>
          )}

          {report.unchecked.length > 0 && shows('unchecked') && (
            <section id="bagian-tidak" className="stack jump-target" aria-labelledby="tidak-title" tabIndex={-1}>
              <div className="stack-sm" style={{ gap: 4 }}>
                <h2 id="tidak-title" className="section-title title-icon title-unchecked"><Icon name="circleDashed" size={24} />Tidak dapat diperiksa</h2>
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

          <section className="card-sunken stack-sm no-print" aria-labelledby="bantuan-title">
            <h2 id="bantuan-title" className="card-title" style={{ fontSize: 15 }}>Masih ragu?</h2>
            <p className="small muted">Tanyakan aturannya, atau hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja di kota tempatmu bekerja.</p>
            <a href="#/tanya" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>Tanya soal aturan</a>
          </section>

          <p className="disclaimer">
            {report.disclaimer || 'Ini bukan nasihat hukum. Hasil CekPKWT dibuat oleh AI dari basis regulasi yang terbatas dan bisa keliru. Untuk masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.'}
          </p>
        </div>

        <aside className="aside report-aside no-print" aria-label="Tindakan dan filter laporan">
          <section className="card summary-actions" aria-label="Tindakan">
            {findings.length > 0 && <a href="#/email-hr" className="btn btn-highlight"><Icon name="mail" />Buat draf email ke HR</a>}
            {questions.length > 0 && <CopyButton text={questionsText(questions)} label="Salin semua pertanyaan" className="btn btn-secondary" />}
            <button type="button" className="btn btn-secondary" onClick={() => print()}><Icon name="download" size={18} />Simpan sebagai PDF</button>
            <p className="hint">
              Tersimpan sementara di browser ini, tidak di server kami, dan terhapus {TTL_MINUTES} menit setelah terakhir dibuka.{' '}
              <button type="button" className="link-btn" onClick={() => confirm('Hapus laporan, draf email, dan percakapan Tanya aturan dari browser ini?') && onClear()}>
                Hapus sekarang
              </button>
            </p>
          </section>
          {/* The same filters as the summary chips, as checkboxes: ticked = shown. None ticked shows everything. */}
          {chips.length > 0 && (
            <section className="card stack-sm filter-panel" role="group" aria-labelledby="filter-title">
              <h2 id="filter-title" className="card-title filter-title">Filter</h2>
              {chips.map((c) => (
                <label key={c.key} className="filter-option">
                  <input type="checkbox" checked={shows(c.key)} onChange={() => toggle(c.key)} />
                  <span className={`filter-icon ${c.cls}`}><Icon name={c.icon} size={16} /></span>
                  <span className="filter-label">{c.label}</span>
                  <span className="small muted">{c.count}</span>
                </label>
              ))}
              {hidden.length > 0 && (
                <button type="button" className="link-btn small" style={{ alignSelf: 'flex-start' }} onClick={() => setHidden([])}>Tampilkan semua</button>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function FindingCard({ finding: f, index }: { finding: Finding; index: number }) {
  const missingQuote = !f.quote || /^tidak (disebutkan|ada)/i.test(f.quote)
  const [open, setOpen] = useState(true)
  const showBtn = useRef<HTMLButtonElement>(null)
  const details = useRef<HTMLDivElement>(null)
  const clip = useRef<HTMLDivElement>(null)
  // Slide the island as one block from under the header: the clip's height and the island's offset run
  // the same animation, so the island's bottom edge stays on the visible edge throughout. The resting
  // open/closed states are plain CSS; this only animates between them.
  const slide = (opening: boolean) => {
    const c = clip.current, d = details.current
    if (!c || !d || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    c.getAnimations().concat(d.getAnimations()).forEach((a) => a.cancel())
    const h = d.offsetHeight
    const timing = { duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
    const height = [{ height: '0px' }, { height: `${h}px` }]
    const move = [{ translate: `0 -${h}px` }, { translate: '0 0' }]
    c.classList.add('is-animating')
    const a = c.animate(opening ? height : height.reverse(), timing)
    d.animate(opening ? move : move.reverse(), timing)
    a.onfinish = a.oncancel = () => c.classList.remove('is-animating')
  }
  // Each toggle removes itself, so focus moves to what replaces it (flushSync renders that first).
  const show = () => { flushSync(() => setOpen(true)); slide(true); details.current?.focus({ preventScroll: true }) }
  const hide = () => { flushSync(() => setOpen(false)); slide(false); showBtn.current?.focus({ preventScroll: true }) }
  // "Simpan sebagai PDF" and Ctrl+P print every finding in full; flushSync renders before the print snapshot.
  useEffect(() => {
    const expand = () => flushSync(() => setOpen(true))
    addEventListener('beforeprint', expand)
    return () => removeEventListener('beforeprint', expand)
  }, [])
  return (
    <article id={`temuan-${index}`} className="finding jump-target" data-severity={f.severity ?? ''} aria-labelledby={`temuan-${index}-judul`} tabIndex={-1}>
      {/* Header island (always shown): number | title | badge, then the contract clause under the title. */}
      <div className="card finding-card">
        <span className="finding-num">{String(index).padStart(2, '0')}</span>
        <h3 id={`temuan-${index}-judul`} className="finding-title balance">{f.title}</h3>
        {f.severity && <SeverityBadge level={f.severity} />}
        {missingQuote
          ? <p className="missing finding-clause">Tidak disebutkan di kontrak.</p>
          : <blockquote className="quote finding-clause"><mark>“{f.quote}”</mark></blockquote>}
      </div>
      {/* Collapsed: the details island peeks out under the header as a short strip holding the toggle. */}
      {!open && (
        <div className="finding-peek no-print">
          <button type="button" ref={showBtn} className="finding-toggle finding-show" aria-expanded={false} aria-controls={`temuan-${index}-isi`} onClick={show}>
            <Icon name="chevronDown" size={18} />Tampilkan detail
            <span className="sr-only">: {f.title}</span>
          </button>
        </div>
      )}
      {/* Closed, the details stay in the page (so they can slide) but are inert, so focus and screen
          readers skip them. See slide() for the animation. */}
      <div className={`drawer${open ? ' is-open' : ''}`}>
      <div className="drawer-clip" ref={clip}>
      <div id={`temuan-${index}-isi`} ref={details} className="finding-body jump-target" tabIndex={-1} inert={!open}>
      {f.issue && (
        <div className="finding-section">
          <span className="kicker">Potensi masalah</span>
          <p><CitedText text={f.issue} /></p>
        </div>
      )}
      {f.references.length > 0 && (
        <div className="finding-section">
          <span className="kicker">Pasal terkait</span>
          <div className="meta-row">{f.references.map((r, i) => <Citation key={i} label={r.label} status={null} />)}</div>
        </div>
      )}
      {f.confidence && (
        <div className="finding-section confidence" data-level={f.confidence.toLowerCase()}>
          <span className="kicker">Keyakinan AI</span>
          {/* Three steps for rendah / sedang / tinggi, coloured red → amber → green; the word carries the meaning. */}
          <p className="confidence-value">
            <span className="meter" aria-hidden="true"><i /><i /><i /></span>
            <strong>{f.confidence.charAt(0).toUpperCase() + f.confidence.slice(1)}</strong>
          </p>
        </div>
      )}
      {f.hr_question && (
        <div className="finding-section">
          <span className="kicker">Pertanyaan untuk HR</span>
          {/* Icon-only copy button, as tall as the question; its name comes from `name`. */}
          <div className="hr-row">
            <p className="hr-question">{f.hr_question}</p>
            <span className="hr-copy no-print"><CopyButton text={f.hr_question} name={`Salin pertanyaan ${index}`} /></span>
          </div>
        </div>
      )}
      <button type="button" className="finding-toggle no-print" aria-expanded={true} aria-controls={`temuan-${index}-isi`} onClick={hide}>
        <Icon name="chevronDown" size={18} />Sembunyikan detail
        <span className="sr-only">: {f.title}</span>
      </button>
      </div>
      </div>
      </div>
    </article>
  )
}

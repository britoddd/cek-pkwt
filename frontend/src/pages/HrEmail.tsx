import { useCallback, useEffect, useRef, useState } from 'react'
import { draftHrEmail, type CheckResult, type Finding, type HrDraft } from '../api'
import { CopyButton, EmptyState, Icon, Loading, Steps } from '../components'

const SUBJECT = 'Pertanyaan Terkait Draf Kontrak Kerja (PKWT)'
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// The input format draft_hr_questions expects: one numbered block per finding.
const findingsText = (findings: Finding[]) =>
  findings.map((f, i) => [
    `${i + 1}. ${f.title}`,
    f.quote && `   Isi kontrak: ${f.quote}`,
    f.issue && `   Potensi masalah: ${f.issue}`,
    f.references.length > 0 && `   Rujukan: ${f.references.map((r) => (r.status ? `${r.label}, status: ${r.status}` : r.label)).join('; ')}`,
    f.hr_question && `   Pertanyaan untuk HR: ${f.hr_question}`,
  ].filter(Boolean).join('\n')).join('\n\n').slice(0, 10_000)

interface Props {
  result: CheckResult | null
  draft: HrDraft | null
  onDraft: (draft: HrDraft) => void
}

export default function HrEmail({ result, draft, onDraft }: Props) {
  const findings = result?.report?.findings ?? []
  const [error, setError] = useState('')
  const [hrEmail, setHrEmail] = useState('')
  const requested = useRef(false)

  const generate = useCallback(async () => {
    setError('')
    try {
      const d = await draftHrEmail(findingsText(findings))
      onDraft({ ...d, subject: d.subject || SUBJECT })
    } catch (err) {
      setError((err as Error).message)
    }
  }, [findings, onDraft])

  // Draft once per report; the draft (and the user's edits) live in App state after that.
  useEffect(() => {
    if (findings.length && !draft && !requested.current) {
      requested.current = true
      generate()
    }
  }, [findings.length, draft, generate])

  if (!findings.length) {
    return (
      <EmptyState title="Belum ada temuan untuk ditanyakan">
        <p className="muted">Draf email dibuat dari temuan di laporan pemeriksaan. Periksa kontrakmu dulu.</p>
        <a href="#/cek" className="btn btn-highlight btn-lg" style={{ alignSelf: 'flex-start' }}>Tempel kontrakmu<Icon name="arrowRight" /></a>
      </EmptyState>
    )
  }

  const to = EMAIL.test(hrEmail.trim()) ? hrEmail.trim() : ''
  const mailto = draft && `mailto:${to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`

  return (
    <div className="container page" style={{ gap: 28 }}>
      <div className="row-between" style={{ alignItems: 'center' }}>
        <a href="#/laporan" className="btn btn-sm" style={{ paddingInline: 0, color: 'var(--color-primary)' }}><Icon name="arrowLeft" size={18} />Kembali ke laporan</a>
        <Steps current={3} />
      </div>

      <div className="stack-sm">
        <h1 className="h1" tabIndex={-1}>Draf pertanyaan untuk HR</h1>
        <p className="muted measure">{findings.length} temuan dari laporanmu, ditulis ulang jadi pertanyaan yang sopan dan tidak menuduh.</p>
      </div>

      {error && (
        <div className="alert" role="alert">
          <Icon name="octagonAlert" />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={generate}>Coba lagi</button>
        </div>
      )}
      {!draft && !error && <Loading>Menyusun draf email dari temuan di laporanmu…</Loading>}

      {draft && (
        <>
          <div className="banner" role="status">
            <Icon name="info" size={22} />
            <strong>Teks email siap disalin</strong>
            <span>Draf ini belum dikirim ke siapa pun. Tinjau, edit, lalu kirim sendiri dari email kamu.</span>
          </div>

          <div className="two-col">
            <section className="main card stack-lg" aria-label="Email">
              <div className="field">
                <label htmlFor="hr-email" className="label">Email HR <span className="muted" style={{ fontWeight: 500 }}>(opsional)</span></label>
                <input id="hr-email" type="email" className="input" autoComplete="off" placeholder="hr@perusahaan.co.id"
                  value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} aria-describedby="hr-email-hint" />
                <span id="hr-email-hint" className="hint">Hanya dipakai untuk membuka aplikasi email kamu. Tidak dikirim ke server CekPKWT.</span>
              </div>
              <div className="field">
                <label htmlFor="subjek" className="label">Subjek</label>
                <input id="subjek" className="input" value={draft.subject} onChange={(e) => onDraft({ ...draft, subject: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="isi-email" className="label">Isi email</label>
                <textarea id="isi-email" className="textarea" rows={18} value={draft.body}
                  onChange={(e) => onDraft({ ...draft, body: e.target.value })} aria-describedby="isi-hint" />
                <span id="isi-hint" className="hint"><mark className="mono">[Nama Anda]</mark> Ganti dengan namamu sebelum mengirim.</span>
              </div>
              <div className="row">
                <a href={mailto ?? undefined} className="btn btn-primary btn-lg"><Icon name="mail" />Buka di aplikasi email</a>
                <CopyButton text={`Subjek: ${draft.subject}\n\n${draft.body}`} label="Salin teks" className="btn btn-secondary btn-lg" />
              </div>
            </section>

            <aside className="aside" aria-label="Tips">
              <section className="card stack" aria-labelledby="tips-title">
                <h2 id="tips-title" className="card-title">Sebelum mengirim</h2>
                <ol className="stack small" style={{ listStyle: 'none', padding: 0 }}>
                  {[
                    ['Bertanya, bukan menuduh', 'Pakai kalimat tanya. Hindari kata seperti “ilegal” atau “melanggar”.'],
                    ['Simpan jawabannya', 'Minta penjelasan tertulis dan simpan balasan HR bersama draf kontrakmu.'],
                    ['Belum jelas? Cari pendampingan', 'Hubungi LBH atau Dinas Tenaga Kerja setempat sebelum tanda tangan.'],
                  ].map(([title, text], i) => (
                    <li key={title} style={{ display: 'flex', gap: 12 }}>
                      <span className="step-dot accent" style={{ width: 26, height: 26, fontSize: 13 }} aria-hidden="true">{i + 1}</span>
                      <span><strong style={{ display: 'block', fontSize: 15 }}>{title}</strong><span className="muted">{text}</span></span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="card-dark small" aria-labelledby="kirim-title" style={{ gap: 10 }}>
                <h2 id="kirim-title" className="card-title" style={{ fontSize: 17 }}><span style={{ color: 'var(--color-accent)', display: 'inline-flex' }}><Icon name="lock" /></span>Kenapa tidak terkirim otomatis?</h2>
                <p>CekPKWT tidak pernah mengirim email. Kamu yang memutuskan isi, waktu, dan tujuannya.</p>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import icon from '../../../assets/logos/cekpkwt-logo-icon.svg'
import { askQuestion } from '../api'
import { Icon, Loading, Paragraphs } from '../components'
import { useStoredState } from '../storage'

const SUGGESTIONS = [
  'Katanya kontrak PKWT boleh pakai masa percobaan 3 bulan, bener kan?',
  'Apa itu uang kompensasi akhir PKWT?',
  'Berapa lama PKWT boleh berlangsung?',
  'Apakah THR berlaku untuk pekerja PKWT?',
]

const NOT_FOUND = /tidak menemukan jawabannya|could not find the answer/i
const INTERRUPTED = 'Jawaban terputus karena halaman dimuat ulang atau ditinggalkan. Tanyakan lagi.'

interface Turn {
  question: string
  answer?: string
  error?: string
}

export default function Ask() {
  const [turns, setTurns] = useStoredState<Turn[]>('chat', [])
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const started = turns.length > 0
  const busy = turns.some((t) => t.answer === undefined && t.error === undefined)

  // A question still loading when the page was reloaded or left lost its answer; say so instead of spinning forever.
  useEffect(() => {
    setTurns((ts) => ts.map((t) => (t.answer === undefined && t.error === undefined ? { ...t, error: INTERRUPTED } : t)))
  }, [setTurns])

  // Keep the newest message in view (smooth scrolling is set in CSS and off for reduced motion).
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [turns])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (q.length < 3) return setError('Tulis pertanyaanmu dulu.')
    setError('')
    setQuestion('')
    inputRef.current?.focus()
    const at = turns.length
    const add = () => setTurns((ts) => [...ts, { question: q }])
    const update = (patch: Partial<Turn>) => setTurns((ts) => ts.map((t, i) => (i === at ? { ...t, ...patch } : t)))
    // The first question moves the composer from the centre to the bottom; animate that where the browser can.
    // An aborted animation (e.g. the phone keyboard closing resizes the viewport) still applies the update.
    if (!started && document.startViewTransition) document.startViewTransition(() => flushSync(add)).ready.catch(() => {})
    else add()
    try {
      update({ answer: (await askQuestion(q)).answer })
    } catch (err) {
      update({ error: (err as Error).message })
    }
  }

  return (
    <div className="container chat-page">
      <section className={`chat-window ${started ? 'is-started' : 'is-empty'}`} aria-labelledby="tanya-title">
        <div ref={logRef} className="chat-log">
          <div className={started ? 'sr-only' : 'chat-intro'}>
            <img src={icon} alt="" width={48} height={48} />
            <h1 id="tanya-title" className="h1" tabIndex={-1}>Tanya aturan PKWT</h1>
            <p className="muted">Jawaban hanya dari pasal yang tersimpan, selalu dengan sitasi. Kalau tidak ada di sumber, CekPKWT bilang tidak tahu.</p>
          </div>
          {started && (
            <div className="chat-turns" role="log" aria-label="Percakapan">
              {turns.map((t, i) => (
                <div key={i} className="chat">
                  <p className="bubble-user">{t.question}</p>
                  <div className="answer">
                    <img src={icon} alt="" width={36} height={36} />
                    {t.answer !== undefined ? <Answer text={t.answer} />
                      : t.error ? <div className="alert" role="alert" style={{ flex: 1 }}><Icon name="octagonAlert" />{t.error}</div>
                      : <div className="answer-body"><Loading>Mencari di sumber regulasi…</Loading></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form className="composer" onSubmit={submit} noValidate>
          {!started && (
            <div className="stack-sm">
              <span id="saran-label" className="kicker" style={{ color: 'var(--color-text-muted)' }}>Coba tanyakan</span>
              <div role="group" aria-labelledby="saran-label" className="row" style={{ gap: 8 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="suggestion" onClick={() => { setQuestion(s); inputRef.current?.focus() }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          <label htmlFor="pertanyaan" className={started ? 'sr-only' : 'label'}>Pertanyaanmu</label>
          <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
            <input id="pertanyaan" ref={inputRef} className="input" style={{ flex: '1 1 auto', minWidth: 0, minHeight: 52 }} maxLength={500}
              value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Contoh: Berapa lama PKWT boleh diperpanjang?"
              aria-describedby="pertanyaan-hint" aria-invalid={!!error} />
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>Tanya<Icon name="arrowRight" size={18} /></button>
          </div>
          {error && <span className="alert" role="alert">{error}</span>}
          <span id="pertanyaan-hint" className="hint">
            Satu pertanyaan dalam satu kalimat. Jawaban hanya dari pasal yang tersimpan di basis regulasi CekPKWT.
            {started && !busy && <>{' '}<button type="button" className="link-btn" onClick={() => confirm('Hapus percakapan ini dari browser?') && setTurns([])}>Hapus percakapan</button></>}
          </span>
        </form>
      </section>
    </div>
  )
}

function Answer({ text }: { text: string }) {
  // The flow ends every answer with a "Rezim aturan: …" line; show it as a footnote.
  const footAt = text.search(/^rezim aturan\s*:/im)
  const body = footAt >= 0 ? text.slice(0, footAt) : text
  const foot = footAt >= 0 ? text.slice(footAt).trim() : ''
  const unknown = NOT_FOUND.test(body)
  return (
    <div className={`answer-body${unknown ? ' unknown' : ''}`}>
      {unknown
        ? <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}><Icon name="circleDashed" /><div className="stack-sm"><Paragraphs text={body} /></div></div>
        : <Paragraphs text={body} />}
      {foot && <p className="answer-foot">{foot}</p>}
    </div>
  )
}

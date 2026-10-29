import { useState, type FormEvent } from 'react'
import icon from '../../../assets/logos/cekpkwt-logo-icon.svg'
import { askQuestion } from '../api'
import { Icon, Loading, Paragraphs } from '../components'

const SUGGESTIONS = [
  'Katanya kontrak PKWT boleh pakai masa percobaan 3 bulan, bener kan?',
  'Apa itu uang kompensasi akhir PKWT?',
  'Berapa lama PKWT boleh berlangsung?',
  'Apakah THR berlaku untuk pekerja PKWT?',
]

const NOT_FOUND = /tidak menemukan jawabannya|could not find the answer/i

interface Turn {
  question: string
  answer?: string
  error?: string
}

export default function Ask() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const busy = turns.some((t) => t.answer === undefined && t.error === undefined)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (q.length < 3) return setError('Tulis pertanyaanmu dulu.')
    setError('')
    setQuestion('')
    const at = turns.length
    const update = (patch: Partial<Turn>) => setTurns((ts) => ts.map((t, i) => (i === at ? { ...t, ...patch } : t)))
    setTurns((ts) => [...ts, { question: q }])
    try {
      update({ answer: (await askQuestion(q)).answer })
    } catch (err) {
      update({ error: (err as Error).message })
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 880 }}>
      <div className="stack-sm">
        <h1 className="h1" tabIndex={-1}>Tanya aturan PKWT</h1>
        <p className="muted">Jawaban hanya dari pasal yang tersimpan, selalu dengan sitasi. Kalau tidak ada di sumber, CekPKWT bilang tidak tahu.</p>
      </div>

      {turns.length > 0 && (
        <section className="chat" aria-label="Percakapan" aria-live="polite">
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
        </section>
      )}

      <form className="card stack" onSubmit={submit} noValidate>
        <div className="stack-sm">
          <span id="saran-label" className="kicker" style={{ color: 'var(--color-text-muted)' }}>Coba tanyakan</span>
          <div role="group" aria-labelledby="saran-label" className="row" style={{ gap: 8 }}>
            {SUGGESTIONS.map((s) => <button key={s} type="button" className="suggestion" onClick={() => setQuestion(s)}>{s}</button>)}
          </div>
        </div>
        <div className="field">
          <label htmlFor="pertanyaan" className="label">Pertanyaanmu</label>
          <div className="row" style={{ gap: 10 }}>
            <input id="pertanyaan" className="input" style={{ flex: '1 1 320px', minWidth: 0, minHeight: 52 }} maxLength={500}
              value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Contoh: Berapa lama PKWT boleh diperpanjang?"
              aria-describedby="pertanyaan-hint" aria-invalid={!!error} />
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>Tanya<Icon name="arrowRight" size={18} /></button>
          </div>
          {error && <span className="alert" role="alert">{error}</span>}
          <span id="pertanyaan-hint" className="hint">Satu pertanyaan dalam satu kalimat. Jawaban hanya dari pasal yang tersimpan di basis regulasi CekPKWT.</span>
        </div>
      </form>

      <p className="disclaimer" style={{ borderTop: 0, paddingTop: 0 }}>
        Ini bukan nasihat hukum. Hasil CekPKWT dibuat oleh AI dari basis regulasi yang terbatas dan bisa keliru. Untuk
        masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.
      </p>
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

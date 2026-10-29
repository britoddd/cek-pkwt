import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Reference, Severity } from './api'

// Lucide icon paths (lucide.dev, ISC licence), inlined to avoid an icon dependency.
const ICONS = {
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  arrowLeft: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  book: <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>,
  pen: <><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></>,
  eyeOff: <><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></>,
  octagonAlert: <><path d="M12 16h.01" /><path d="M12 8v4" /><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" /></>,
  triangleAlert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  circleCheck: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  circleDashed: <><path d="M10.1 2.182a10 10 0 0 1 3.8 0" /><path d="M13.9 21.818a10 10 0 0 1-3.8 0" /><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7" /><path d="M2.182 13.9a10 10 0 0 1 0-3.8" /><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69" /><path d="M21.818 10.1a10 10 0 0 1 0 3.8" /><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" /><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7" /></>,
  copy: <><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
  mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  download: <><path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /></>,
  messageCircle: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
}

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  )
}

const SEVERITY: Record<Severity, { icon: IconName; label: string }> = {
  tinggi: { icon: 'octagonAlert', label: 'Tinggi' },
  sedang: { icon: 'triangleAlert', label: 'Sedang' },
  rendah: { icon: 'info', label: 'Rendah' },
}

export function SeverityBadge({ level }: { level: Severity }) {
  const s = SEVERITY[level]
  return <span className={`badge sev-${level}`}><Icon name={s.icon} size={16} />Keparahan: {s.label}</span>
}

// Corpus status codes in words a reader understands.
const STATUS_LABEL: Record<string, string> = {
  dimaknai_putusan_mk: 'dimaknai Putusan MK',
  berlaku_imbauan: 'imbauan',
  catatan_sistem: 'catatan sistem',
}

export function Citation({ label, status }: Reference) {
  return (
    <span className="cite">
      <span className="cite-dot" data-status={status ?? ''} aria-hidden="true" />
      {label}{status && ` · ${STATUS_LABEL[status] ?? status}`}
    </span>
  )
}

// Copy with brief, announced feedback that resets itself.
export function CopyButton({ text, label = 'Salin', name, className = 'btn btn-secondary btn-sm' }: {
  text: string
  label?: string
  name?: string // accessible name when the visible label lacks context, e.g. "Salin pertanyaan 2"
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = () => {
    const done = (s: 'copied' | 'failed') => {
      setState(s)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setState('idle'), 2500)
    }
    if (!navigator.clipboard) return done('failed')
    navigator.clipboard.writeText(text).then(() => done('copied'), () => done('failed'))
  }

  return (
    <>
      <button type="button" className={className} onClick={copy} aria-label={state === 'idle' ? name : undefined}>
        <Icon name={state === 'copied' ? 'check' : 'copy'} size={16} />
        {state === 'copied' ? 'Tersalin' : state === 'failed' ? 'Gagal menyalin' : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Tersalin ke clipboard' : state === 'failed' ? 'Gagal menyalin. Pilih teksnya lalu salin manual.' : ''}
      </span>
    </>
  )
}

// "(PP 35/2021, Pasal 12, berlaku)" style citations inside model text.
const CITATION = /(\([^()]*?\b(?:berlaku(?:_imbauan)?|diubah|disisipkan|dimaknai_putusan_mk|catatan_sistem)\b[^()]*\))/g

export function CitedText({ text }: { text: string }) {
  return <>{text.split(CITATION).map((part, i) =>
    i % 2 ? <span key={i} className="cite-inline">{part}</span> : part.replace(/\*\*/g, ''))}</>
}

export function Paragraphs({ text }: { text: string }) {
  return <>{text.trim().split(/\n{2,}/).map((p, i) => <p key={i} className="pre-line"><CitedText text={p} /></p>)}</>
}

const STEPS = ['Tempel kontrak', 'Baca laporan', 'Tanyakan ke HR']

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="steps" aria-label="Langkah">
      {STEPS.map((label, i) => (
        <li key={label} className={i + 1 < current ? 'done' : undefined} aria-current={i + 1 === current ? 'step' : undefined}>
          <span className="step-num" aria-hidden="true">{i + 1 < current ? <Icon name="check" size={14} /> : i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  )
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container page">
      <div className="card empty stack">
        <h1 className="h1" tabIndex={-1}>{title}</h1>
        {children}
      </div>
    </div>
  )
}

export function Loading({ children }: { children: ReactNode }) {
  return (
    <div className="loading" role="status">
      <span className="marker-bar" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

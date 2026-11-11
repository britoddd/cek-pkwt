// Types mirror backend/report.py.
export type Severity = 'tinggi' | 'sedang' | 'rendah'

export interface Reference {
  label: string
  status: string | null
  url?: string | null // the official document this article comes from
  regulation?: string // "PP 35/2021"; reports saved before this field existed only have `label`
  article?: string // "Pasal 12"
  topic?: string | null // "Masa percobaan"
  text?: string | null // the article's own words, from the corpus
}

export interface Finding {
  title: string
  quote: string
  issue: string
  references: Reference[]
  severity: Severity | null
  confidence: string | null
  hr_question: string
}

export interface Report {
  summary: string
  findings: Finding[]
  no_issues: string[]
  unchecked: string[]
  notes: string[]
  disclaimer: string
}

export interface CheckResult {
  markdown: string
  report: Report | null
  checkedAt: string // ISO time; a string so the result survives JSON storage
}

export interface HrDraft {
  raw: string
  subject: string
  body: string
}

const UNAVAILABLE = 'Layanan CekPKWT sedang tidak tersedia. Coba lagi beberapa saat lagi.'

// Where the backend lives, e.g. https://cekpkwt-api.britod.my.id (set VITE_API_BASE at build time).
// Empty = same domain, as in local dev where Vite forwards /api to the backend.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '')

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // fetch also fails when a proxy (e.g. Cloudflare's 524 timeout) answers without CORS headers,
    // so only blame the user's connection when the browser says it is offline.
    throw new Error(
      navigator.onLine
        ? 'Server tidak merespons (mungkin sedang memulai ulang). Coba lagi dalam beberapa menit.'
        : 'Tidak bisa terhubung ke server. Periksa koneksi internetmu lalu coba lagi.',
    )
  }
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail
    if (typeof detail === 'string') throw new Error(detail)
    throw new Error(res.status === 422 ? 'Isian belum sesuai. Periksa lagi lalu coba kembali.' : UNAVAILABLE)
  }
  return res.json()
}

export const checkContract = (contract: string, region: string | null) =>
  post<Omit<CheckResult, 'checkedAt'>>('/api/check', { contract, region })

export const askQuestion = (question: string) => post<{ answer: string }>('/api/ask', { question })

export const draftHrEmail = (findings: string) => post<HrDraft>('/api/hr-draft', { findings })

export const getRegions = (): Promise<string[]> => fetch(API_BASE + '/api/regions').then((r) => (r.ok ? r.json() : []))

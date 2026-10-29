// Types mirror backend/report.py.
export type Severity = 'tinggi' | 'sedang' | 'rendah'

export interface Reference {
  label: string
  status: string | null
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

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi internetmu lalu coba lagi.')
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

export const getRegions = (): Promise<string[]> => fetch('/api/regions').then((r) => (r.ok ? r.json() : []))

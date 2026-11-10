// Mirrors langflow/components/pii_redactor.py (the PII Redactor in langflow/check_work_contract.json) so the
// preview shows what the model will receive. Only a preview: the redaction that counts runs in Langflow.
// evaluation/pii_eval.py checks that both give the same output.
const PATTERNS: [tag: string, re: RegExp, keepPrefix?: boolean][] = [
  ['[EMAIL]', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ['[NPWP]', /\b\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}\b/g],
  ['[NIK]', /(?<![\d.,])(?:\d[\s.-]?){15}\d(?!\d|[.,]\d)/g],
  ['[NO_REKENING]', /((?:rekening|\brek\.|\bno\.?\s*rek\b\.?|\baccount(?:\s+number)?)[^\d\n]{0,40})\d[\d\s.-]{4,22}\d/gi, true],
  ['[NOMOR_ID]', /((?:\bnpwp|\bbpjs|\bkpj|\bno\.?\s*kk\b|kartu\s+keluarga)[^\d\n]{0,40})\d[\d\s.-]{4,22}\d/gi, true],
  ['[TELEPON]', /(?<![\w\d])\(?(?:\+62|62|0)[\s-]?\(?(?:8\d{1,2}|[2-79]\d{1,3})\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}(?!\d)/g],
]

const LABELLED = new RegExp(
  String.raw`^(\s*(?:(?:\d{1,2}|[a-z])[.)]\s*|[-•*]\s*)?` +
    String.raw`(?:nama\s+ibu\s+kandung|nama(?:\s+lengkap)?(?:\s+(?:pekerja|karyawan|pihak\s+kedua))?` +
    String.raw`|(?:full\s+)?name(?:\s+of\s+employee)?|employee\s+name` +
    String.raw`|alamat(?:\s+(?:ktp|rumah|domisili|tinggal|pekerja|karyawan))?|domisili|(?:home\s+|residential\s+)?address` +
    String.raw`|tempat\s*[,/]?\s*(?:tanggal|tgl\.?)\s*lahir|(?:tanggal|tgl\.?)\s*lahir|ttl` +
    String.raw`|(?:place\s+(?:and|&)\s+)?date\s+of\s+birth)\s*[:：]\s*)(\S.*?)(\r?)$`,
  'i',
)
// Company data on labelled lines is not personal data.
const KEEP_LABEL = /perusahaan|pihak pertama|\bpt\b|\bcv\b|direktur|hrd|company|employer|office/i
// Not "Perum": in addresses it is short for perumahan (housing).
const COMPANY = /^(?:pt|cv|ud|pd|koperasi|yayasan|firma)\b/i
const PARTY = new RegExp(
  String.raw`^\s*(?:[ivx]+[.)]\s*|\d+[.)]\s*)?` +
    String.raw`(?:(pihak\s+pertama|first\s+party|employer|company|perusahaan)|pihak\s+kedua|second\s+party|employee|pekerja|karyawan)` +
    String.raw`\s*[:,.]?\s*$`,
  'i',
)
const NAME = String.raw`[A-Z][A-Za-z'’.-]*(?:\s+[A-Z][A-Za-z'’.-]*){0,4}`
const SIGNED = new RegExp(
  String.raw`([Bb][Ee][Rr][Tt][Aa][Nn][Dd][Aa][ \t]+[Tt][Aa][Nn][Gg][Aa][Nn][ \t]+[Dd][Ii][ \t]+[Bb][Aa][Ww][Aa][Hh][ \t]+[Ii][Nn][Ii][ \t]*[,:]?[ \t]*)(` +
    NAME +
    String.raw`)(?=[ \t]*[,(])`,
  'g',
)
const HONORIFIC = new RegExp(
  String.raw`\b((?:Sdr|Sdri|Bpk|Tn|Ny|Nn|Mr|Mrs|Ms)\.?\s+|(?:Saudara|Saudari|Bapak|Ibu(?!\s+(?:Kota|Kandung)))\s+)(` + NAME + ')',
  'g',
)
const BORN =
  /(\blahir\s+(?:di\s+[^,\n]{1,30}?\s+)?(?:pada\s+)?(?:tanggal\s+|tgl\.?\s+)?)(\d{1,2}[\s./-]+(?:[a-z]+|\d{1,2})[\s./-]+\d{4})/gi
const LIVES_AT =
  /(\b(?:bertempat\s+tinggal|berdomisili)\s+di\s+)([^,\n]+(?:,\s*(?:no\.?|rt|rw|blok|kel\.?|kec\.?|gg\.?)\b[^,\n]*)*)/gi
const SIGN_HEAD =
  /^\(?(?:pihak\s+pertama|pihak\s+kedua|first\s+party|second\s+party|company|employer|employee|pekerja|karyawan|perusahaan|ttd|mengetahui|hormat\s+kami)\)?[,:.]?$/i
const SIGN_CELL = new RegExp(String.raw`^(\(?)(` + NAME + String.raw`)(\)?,?)$`)
// Words that make a signature cell a role or heading, not a name.
const ROLE_WORDS = new Set(
  ('manajer manager direktur director kepala head hrd hr sdm personalia pekerja karyawan employee employer company ' +
    'pihak pertama kedua first second party pemilik owner usaha supervisor plant area branch cabang operasional ' +
    'proyek general human capital resources staf staff ketua pimpinan materai meterai ttd saksi mengetahui ' +
    'menyetujui disetujui hormat kami tanda tangan perusahaan of and dan the').split(' '),
)

const trimChars = (s: string, chars: string) => {
  let a = 0
  let b = s.length
  while (a < b && chars.includes(s[a])) a++
  while (b > a && chars.includes(s[b - 1])) b--
  return s.slice(a, b)
}

function isSignHead(line: string): boolean {
  const cells = line.trim().split(/\s{2,}|\t/).filter(Boolean)
  return cells.length > 0 && cells.every((c) => SIGN_HEAD.test(c))
}

function signCell(cell: string): string | null {
  const m = SIGN_CELL.exec(cell)
  if (!m || COMPANY.test(m[2])) return null
  if (m[2].split(/\s+/).some((w) => ROLE_WORDS.has(trimChars(w, ".,'’-").toLowerCase()))) return null
  return `${m[1]}[NAMA]${m[3]}`
}

export function redact(text: string): { text: string; count: number } {
  let count = 0
  const names = new Set<string>()
  const lines = text.split('\n')
  let party: 'first' | 'second' | null = null // "first" inside a company block, so its Nama/Alamat lines are kept
  let blockHasLines = false
  let inAddress = false
  lines.forEach((line, i) => {
    if (!line.trim()) {
      if (blockHasLines) party = null
      inAddress = false
      return
    }
    const heading = PARTY.exec(line)
    if (heading) {
      party = heading[1] ? 'first' : 'second'
      blockHasLines = false
      inAddress = false
      return
    }
    blockHasLines = true
    const m = LABELLED.exec(line)
    if (m) {
      const [, label, value, cr] = m
      inAddress = false
      if (party === 'first' || KEEP_LABEL.test(label) || COMPANY.test(value)) return
      const low = label.toLowerCase()
      let tag = '[NAMA]'
      if (low.includes('alamat') || low.includes('address') || low.includes('domisili')) {
        tag = '[ALAMAT]'
        inAddress = true
      } else if (/lahir|ttl|birth/.test(low)) {
        tag = '[TTL]'
      } else {
        names.add(trimChars(value, ' ,.;'))
      }
      lines[i] = `${label}${tag}${cr}`
      count++
    } else if (inAddress && ' \t'.includes(line[0]) && !line.includes(':')) {
      // Wrapped address line ("        RT 004/RW 002, Kel. ..."): keep the indent, mask the rest.
      lines[i] = line.slice(0, line.length - line.trimStart().length) + '[ALAMAT]' + (line.endsWith('\r') ? '\r' : '')
      count++
    } else {
      inAddress = false
    }
  })
  let out = lines.join('\n')

  // Names introduced in a sentence, then every repeat of a known name (signature columns included).
  for (const m of out.matchAll(SIGNED)) names.add(m[2].trim())
  // Never spread a company or a role ("PIHAK PERTAMA", "PT ...") as if it were a person's name.
  const known = [...names].filter((n) => n.length >= 3 && signCell(n)).sort((a, b) => b.length - a.length)
  for (const name of known) {
    const re = new RegExp(String.raw`(?<!\w)` + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + String.raw`(?!\w)`, 'gi')
    out = out.replace(re, () => (count++, '[NAMA]'))
  }
  out = out.replace(HONORIFIC, (_m, p: string) => (count++, `${p}[NAMA]`))
  out = out.replace(BORN, (_m, p: string) => (count++, `${p}[TTL]`))
  out = out.replace(LIVES_AT, (_m, p: string) => (count++, `${p}[ALAMAT]`))

  // Signature area: unlabelled names in the cells below the first party heading in the last 15 lines.
  const sig = out.split('\n')
  let start = -1
  for (let i = Math.max(0, sig.length - 15); i < sig.length; i++) {
    if (isSignHead(sig[i])) {
      start = i
      break
    }
  }
  if (start >= 0) {
    for (let i = start + 1; i < sig.length; i++) {
      const cr = sig[i].endsWith('\r') ? '\r' : ''
      const parts = sig[i].replace(/\r$/, '').split(/(\s{2,}|\t)/)
      let changed = 0
      const next = parts.map((p, j) => {
        if (j % 2) return p
        const masked = signCell(p)
        if (masked && masked !== p) changed++
        return masked ?? p
      })
      if (changed) {
        count += changed
        sig[i] = next.join('') + cr
      }
    }
    out = sig.join('\n')
  }

  for (const [tag, re, keepPrefix] of PATTERNS) {
    out = out.replace(re, (_match, prefix) => {
      count++
      return keepPrefix ? prefix + tag : tag
    })
  }
  return { text: out, count }
}

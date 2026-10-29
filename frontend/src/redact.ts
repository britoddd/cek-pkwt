// Mirrors the PII Redactor component in langflow/check_work_contract.json so the preview shows
// what the model will receive. Only a preview: the redaction that counts runs in Langflow.
const PATTERNS: [tag: string, re: RegExp, keepPrefix?: boolean][] = [
  ['[EMAIL]', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ['[NPWP]', /\b\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}\b/g],
  ['[NIK]', /(?<![\d.,])(?:\d[\s.-]?){15}\d(?![\d.,])/g],
  ['[NO_REKENING]', /(rekening[^\d\n]{0,40})\d[\d\s.-]{4,22}\d/gi, true],
  ['[TELEPON]', /(?<![\w\d])(?:\+62|62|0)[\s-]?(?:8\d{1,2}|2\d{1,2})[\s.-]?\d{3,4}[\s.-]?\d{3,5}(?!\d)/g],
]

const LABELLED =
  /^(\s*(?:\d+[.)]\s*)?(?:nama(?:\s+lengkap)?(?:\s+(?:pekerja|karyawan|pihak kedua))?|(?:full\s+)?name(?:\s+of\s+employee)?|employee\s+name|alamat(?:\s+(?:rumah|domisili|pekerja|karyawan))?|(?:home\s+|residential\s+)?address|tempat[,/ ]*\s*tanggal\s+lahir|ttl|nama\s+ibu\s+kandung|(?:place\s+(?:and|&)\s+)?date\s+of\s+birth)\s*[:：]\s*)(.+)$/gim

// Company data on labelled lines is not personal data.
const KEEP_LABEL = /perusahaan|pihak pertama|pt\b|cv\b|direktur|hrd|company|employer|office/i

export function redact(text: string): { text: string; count: number } {
  let count = 0
  let out = text.replace(LABELLED, (whole, label: string) => {
    if (KEEP_LABEL.test(label)) return whole
    count++
    const low = label.toLowerCase()
    if (low.includes('alamat') || low.includes('address')) return `${label}[ALAMAT]`
    return /lahir|ttl|birth/.test(low) ? `${label}[TTL]` : `${label}[NAMA]`
  })
  for (const [tag, re, keepPrefix] of PATTERNS) {
    out = out.replace(re, (_match, prefix) => {
      count++
      return keepPrefix ? prefix + tag : tag
    })
  }
  return { text: out, count }
}

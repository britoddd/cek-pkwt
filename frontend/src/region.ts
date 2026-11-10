// Guesses the work location from the (redacted) contract text, for the "Lokasi kerja" label only.
// The default option still lets the server detect it, so a wrong guess never changes the check.
const WORK_LINE = /lokasi kerja|tempat kerja|penempatan|ditempatkan|work location|place of work/i

function pattern(region: string): RegExp {
  // "Kota Tangerang" must not match inside "Kota Tangerang Selatan".
  const notLonger = String.raw`(?![ \t]+(?:Selatan|Utara|Timur|Barat|Tengah))`
  if (region === 'DKI Jakarta') return new RegExp(String.raw`\b(?:DKI[ \t]+)?Jakarta\b`, 'i')
  const [kind, ...rest] = region.split(' ')
  const name = rest.join(String.raw`[ \t]+`)
  const prefix = kind === 'Kabupaten' ? String.raw`(?:Kabupaten|Kab\.?)` : kind
  return new RegExp(String.raw`\b${prefix}[ \t]+${name}\b${notLonger}`, 'i')
}

// Earliest region named on a work-location line, else earliest anywhere; null when none is named.
export function detectRegion(text: string, regions: string[]): string | null {
  const earliest = (scope: string) => {
    let best: { region: string; at: number } | null = null
    for (const region of regions) {
      const at = scope.search(pattern(region))
      if (at >= 0 && (!best || at < best.at)) best = { region, at }
    }
    return best?.region ?? null
  }
  const workLines = text.split('\n').filter((l) => WORK_LINE.test(l)).join('\n')
  return earliest(workLines) ?? earliest(text)
}

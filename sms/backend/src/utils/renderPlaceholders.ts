export function renderPlaceholders(
  content: string,
  payload: Record<string, string>,
  extras: Record<string, string> = {},
): string {
  const merged = { ...extras, ...payload }
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => merged[key] ?? '')
}

export function findMissingPlaceholders(
  requiredKeys: string[],
  payload: Record<string, string>,
  extras: Record<string, string> = {},
): string[] {
  const merged = { ...extras, ...payload }
  const missing: string[] = []

  for (const key of requiredKeys) {
    if (!merged[key]?.trim()) {
      missing.push(key)
    }
  }

  return missing
}

const GSM7_SINGLE = 160
const GSM7_MULTI = 153
const UCS2_SINGLE = 70
const UCS2_MULTI = 67

// Characters covered by the GSM 03.38 basic + basic extension set.
const GSM7_CHARS = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'.split(''),
)
const GSM7_EXTENDED = new Set('^{}\\[~]|€'.split(''))

function isGsm7(text: string): boolean {
  for (const ch of text) {
    if (!GSM7_CHARS.has(ch) && !GSM7_EXTENDED.has(ch)) return false
  }
  return true
}

/** Estimate SMS length + segment count for editor guidance. */
export function estimateSegments(text: string): { chars: number; segments: number; encoding: 'GSM-7' | 'UCS-2' } {
  const gsm7 = isGsm7(text)
  // Extended GSM-7 chars occupy two code units.
  let units = 0
  for (const ch of text) {
    units += gsm7 && GSM7_EXTENDED.has(ch) ? 2 : 1
  }
  const single = gsm7 ? GSM7_SINGLE : UCS2_SINGLE
  const multi = gsm7 ? GSM7_MULTI : UCS2_MULTI
  const segments = units <= single ? (units === 0 ? 0 : 1) : Math.ceil(units / multi)
  return { chars: units, segments, encoding: gsm7 ? 'GSM-7' : 'UCS-2' }
}

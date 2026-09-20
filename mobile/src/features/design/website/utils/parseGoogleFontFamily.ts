const GOOGLE_FONTS_HOSTS = new Set(['fonts.googleapis.com', 'fonts.google.com'])

function isGoogleFontsHost(hostname: string): boolean {
  return GOOGLE_FONTS_HOSTS.has(hostname.replace(/^www\./, ''))
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]+|['"]+$/g, '').trim()
}

function isStylesheetUrl(url: string): boolean {
  return /\/css2?(\?|$)/i.test(url)
}

/** Pull a fonts.googleapis.com stylesheet URL from pasted embed code or a raw URL. */
export function extractGoogleFontUrl(raw: string): string | null {
  const trimmed = stripQuotes(raw.trim())
  if (!trimmed) return null

  const hrefPattern = /href=(['"])(https:\/\/fonts\.googleapis\.com\/[^'"]+)\1/gi
  const stylesheetUrls: string[] = []
  let match: RegExpExecArray | null = hrefPattern.exec(trimmed)
  while (match) {
    const url = match[2].trim()
    if (isStylesheetUrl(url)) stylesheetUrls.push(url)
    match = hrefPattern.exec(trimmed)
  }
  if (stylesheetUrls[0]) return stylesheetUrls[0]

  const importMatch = trimmed.match(
    /url\((['"]?)(https:\/\/fonts\.googleapis\.com\/[^'")\s]+)\1\)/i,
  )
  if (importMatch?.[2]) return importMatch[2].trim()

  if (/^https:\/\/fonts\.googleapis\.com\/css/i.test(trimmed)) return trimmed

  return null
}

export function normalizeGoogleFontInput(raw: string): string {
  const extracted = extractGoogleFontUrl(raw)
  if (extracted) return extracted
  return stripQuotes(raw.trim())
}

export function parseGoogleFontFamily(url: string): string | null {
  const href = extractGoogleFontUrl(url) ?? stripQuotes(url.trim())
  if (!href || !/^https:\/\/fonts\.googleapis\.com\//i.test(href)) return null
  try {
    const parsed = new URL(href)
    if (!isGoogleFontsHost(parsed.hostname)) return null
    const familyParam =
      parsed.searchParams.get('family') ?? parsed.searchParams.get('selection.family')
    if (!familyParam) return null
    const name = decodeURIComponent(familyParam.split(':')[0] ?? '')
      .replace(/\+/g, ' ')
      .trim()
    return name || null
  } catch {
    return null
  }
}

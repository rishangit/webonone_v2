function extractFontUrl(raw: string): string {
  const trimmed = raw.trim()
  const importMatch = trimmed.match(/url\((['"]?)(.+?)\1\)/i)
  if (importMatch?.[2]) return importMatch[2].trim()
  return trimmed
}

export function parseGoogleFontFamily(url: string): string | null {
  const href = extractFontUrl(url)
  if (!href) return null
  try {
    const parsed = new URL(href)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host !== 'fonts.googleapis.com' && host !== 'fonts.google.com') return null
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

const HEX_PATTERN = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

/** Returns true for #RGB or #RRGGBB (optional leading #). */
export function isValidHexColor(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false
  return HEX_PATTERN.test(trimmed.startsWith('#') ? trimmed : `#${trimmed}`)
}

/** Normalize to #RRGGBB uppercase; returns fallback when invalid. */
export function normalizeHexColor(input: string, fallback = '#000000'): string {
  const trimmed = input.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const match = HEX_PATTERN.exec(withHash)
  if (!match) return fallback

  const body = match[1]!
  if (body.length === 3) {
    const [r, g, b] = body
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return `#${body}`.toUpperCase()
}

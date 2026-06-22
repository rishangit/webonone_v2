export type ParsedThemeColors = {
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
}

const HEX_COLOR = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/

function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  if (!HEX_COLOR.test(trimmed)) return null

  if (trimmed.length === 4) {
    const r = trimmed[1]
    const g = trimmed[2]
    const b = trimmed[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }

  return trimmed.toUpperCase()
}

/** Returns null if any of --color-1..--color-5 is missing or not valid hex. */
export function parseCssThemeVariables(input: string): ParsedThemeColors | null {
  const colors: Partial<ParsedThemeColors> = {}

  for (let i = 1; i <= 5; i += 1) {
    const pattern = new RegExp(`--color-${i}\\s*:\\s*(#[0-9A-Fa-f]{3,6})`, 'i')
    const match = input.match(pattern)
    if (!match?.[1]) return null

    const normalized = normalizeHex(match[1])
    if (!normalized) return null

    colors[`color${i}` as keyof ParsedThemeColors] = normalized
  }

  return colors as ParsedThemeColors
}

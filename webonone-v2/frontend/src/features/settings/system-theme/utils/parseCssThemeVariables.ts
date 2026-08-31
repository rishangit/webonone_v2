import type { ThemeColors } from '@webonone/theme'

export type ParsedThemeColors = ThemeColors

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

function parseHexFromCss(input: string, varName: string): string | null {
  const pattern = new RegExp(`${varName}\\s*:\\s*(#[0-9A-Fa-f]{3,6})`, 'i')
  const match = input.match(pattern)
  if (!match?.[1]) return null
  return normalizeHex(match[1])
}

/** Returns null if required semantic or legacy palette vars are missing. */
export function parseCssThemeVariables(input: string): ParsedThemeColors | null {
  const primary =
    parseHexFromCss(input, '--color-primary') ?? parseHexFromCss(input, '--color-1')
  const secondary =
    parseHexFromCss(input, '--color-secondary') ?? parseHexFromCss(input, '--color-2')
  const background =
    parseHexFromCss(input, '--color-background') ?? parseHexFromCss(input, '--color-4')
  const surface =
    parseHexFromCss(input, '--color-surface') ?? parseHexFromCss(input, '--color-5')
  const text =
    parseHexFromCss(input, '--color-text') ?? parseHexFromCss(input, '--color-3')

  if (!primary || !secondary || !background || !surface || !text) return null

  return { primary, secondary, background, surface, text }
}

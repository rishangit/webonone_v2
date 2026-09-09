import type { ThemeColors } from './types'

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
export function parseCssThemeVariables(input: string): ThemeColors | null {
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

export const CSS_PALETTE_MAX_SWATCHES = 7

/** Numbered `--color-1`…`--color-7` (1–7 swatches), or a full semantic 5-color block. */
export function parseCssPaletteSwatches(input: string): string[] | null {
  const numbered: string[] = []
  for (let i = 1; i <= CSS_PALETTE_MAX_SWATCHES; i++) {
    const hex = parseHexFromCss(input, `--color-${i}`)
    if (hex) numbered.push(hex)
  }
  if (numbered.length >= 1) return numbered

  const semantic = parseCssThemeVariables(input)
  if (!semantic) return null
  return [semantic.primary, semantic.secondary, semantic.background, semantic.surface, semantic.text]
}

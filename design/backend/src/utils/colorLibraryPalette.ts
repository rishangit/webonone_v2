const HEX = /^#[0-9A-Fa-f]{6}$/

export const COLOR_LIBRARY_PALETTE_KEYS = [
  'color_1',
  'color_2',
  'color_3',
  'color_4',
  'color_5',
  'color_6',
] as const

export type ColorLibraryPaletteKey = (typeof COLOR_LIBRARY_PALETTE_KEYS)[number]

export type WebsiteColorLibraryPalette = Record<ColorLibraryPaletteKey, string>

export function normalizePaletteHex(value: string): string {
  const trimmed = value.trim()
  if (!HEX.test(trimmed)) return trimmed
  return trimmed.toUpperCase()
}

export function normalizeColorLibraryPalette(
  palette: WebsiteColorLibraryPalette,
): WebsiteColorLibraryPalette {
  const out: Partial<WebsiteColorLibraryPalette> = {}
  for (const key of COLOR_LIBRARY_PALETTE_KEYS) {
    out[key] = normalizePaletteHex(palette[key])
  }
  return out as WebsiteColorLibraryPalette
}

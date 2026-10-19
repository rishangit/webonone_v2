const HEX = /^#[0-9A-Fa-f]{6}$/

export const COLOR_LIBRARY_PALETTE_MAX_COLORS = 6

export const COLOR_LIBRARY_PALETTE_KEYS = [
  'color_1',
  'color_2',
  'color_3',
  'color_4',
  'color_5',
  'color_6',
] as const

export type ColorLibraryPaletteKey = (typeof COLOR_LIBRARY_PALETTE_KEYS)[number]

export type WebsiteColorLibraryColor = {
  name: string
  value: string
}

export type WebsiteColorLibraryPalette = {
  colors: WebsiteColorLibraryColor[]
}

export type LegacyWebsiteColorLibraryPalette = Record<ColorLibraryPaletteKey, string>

export function normalizePaletteHex(value: string): string {
  const trimmed = value.trim()
  if (!HEX.test(trimmed)) return trimmed
  return trimmed.toUpperCase()
}

function isLegacyPalette(value: unknown): value is LegacyWebsiteColorLibraryPalette {
  if (!value || typeof value !== 'object') return false
  return COLOR_LIBRARY_PALETTE_KEYS.every((key) => key in value)
}

export function legacyPaletteToColors(palette: LegacyWebsiteColorLibraryPalette): WebsiteColorLibraryColor[] {
  return COLOR_LIBRARY_PALETTE_KEYS.map((key, index) => ({
    name: `Color ${index + 1}`,
    value: normalizePaletteHex(palette[key]),
  }))
}

export function normalizeColorLibraryPalette(palette: WebsiteColorLibraryPalette): WebsiteColorLibraryPalette {
  return {
    colors: palette.colors.map((entry) => ({
      name: entry.name.trim(),
      value: normalizePaletteHex(entry.value),
    })),
  }
}

export function parseStoredColorLibraryPalette(raw: unknown): WebsiteColorLibraryPalette {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (value && typeof value === 'object' && Array.isArray((value as WebsiteColorLibraryPalette).colors)) {
    return normalizeColorLibraryPalette(value as WebsiteColorLibraryPalette)
  }
  if (isLegacyPalette(value)) {
    return normalizeColorLibraryPalette({ colors: legacyPaletteToColors(value) })
  }
  throw new Error('Invalid color library palette')
}

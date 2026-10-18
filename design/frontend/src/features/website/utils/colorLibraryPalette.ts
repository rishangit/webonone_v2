const HEX = /^#[0-9A-Fa-f]{6}$/

export const COLOR_LIBRARY_PALETTE_SLOT_COUNT = 6

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

export function paletteToSwatches(palette: WebsiteColorLibraryPalette): string[] {
  return COLOR_LIBRARY_PALETTE_KEYS.map((key) => normalizePaletteHex(palette[key]))
}

export function emptyColorLibraryPalette(fallback = '#111827'): WebsiteColorLibraryPalette {
  return {
    color_1: fallback,
    color_2: fallback,
    color_3: fallback,
    color_4: fallback,
    color_5: fallback,
    color_6: fallback,
  }
}

export function paletteFingerprint(palette: WebsiteColorLibraryPalette): string {
  return paletteToSwatches(palette).map((value) => value.toLowerCase()).join('|')
}

export function themeIncludesPalette(
  themeColorValues: string[],
  palette: WebsiteColorLibraryPalette,
): boolean {
  const onTheme = new Set(themeColorValues.map((value) => value.trim().toLowerCase()))
  return paletteToSwatches(palette).every((value) => onTheme.has(value.toLowerCase()))
}

export type FlattenedLibraryColor = {
  optionId: string
  paletteId: string
  paletteName: string
  slot: number
  value: string
}

export function findColorOptionId(value: string, options: FlattenedLibraryColor[]): string {
  const normalized = value.trim().toLowerCase()
  return options.find((option) => option.value.toLowerCase() === normalized)?.optionId ?? ''
}

export function flattenColorLibraryPalettes(
  items: Array<{ id: string; name: string; palette: WebsiteColorLibraryPalette }>,
): FlattenedLibraryColor[] {
  return items.flatMap((item) =>
    paletteToSwatches(item.palette).map((value, index) => ({
      optionId: `${item.id}:color_${index + 1}`,
      paletteId: item.id,
      paletteName: item.name,
      slot: index + 1,
      value,
    })),
  )
}

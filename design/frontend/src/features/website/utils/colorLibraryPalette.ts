import type { WebsiteColorLibraryColor, WebsiteColorLibraryPalette } from '../types'

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

type LegacyWebsiteColorLibraryPalette = Record<ColorLibraryPaletteKey, string>

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

export function paletteToSwatches(palette: WebsiteColorLibraryPalette): string[] {
  return palette.colors.map((entry) => normalizePaletteHex(entry.value))
}

export function emptyColorLibraryPalette(fallback = '#111827'): WebsiteColorLibraryPalette {
  return {
    colors: [{ name: 'Color 1', value: normalizePaletteHex(fallback) }],
  }
}

export function libraryPaletteFromCssSwatches(
  swatches: string[],
  nameForSlot: (slotIndex: number) => string,
): WebsiteColorLibraryPalette {
  return {
    colors: swatches.slice(0, COLOR_LIBRARY_PALETTE_MAX_COLORS).map((value, index) => ({
      name: nameForSlot(index + 1),
      value: normalizePaletteHex(value),
    })),
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
  colorName: string
  value: string
}

export function findColorOptionId(value: string, options: FlattenedLibraryColor[]): string {
  const normalized = value.trim().toLowerCase()
  return options.find((option) => option.value.toLowerCase() === normalized)?.optionId ?? ''
}

export function formatPaletteScopedColorLabel(color: FlattenedLibraryColor, slotLabel: string) {
  const label = color.colorName.trim() || slotLabel
  return `${label} (${color.value})`
}

export function inferLibraryPaletteId(options: FlattenedLibraryColor[], colorOptionIds: string[]): string {
  const ids = new Set(colorOptionIds.filter(Boolean))
  const match = options.find((option) => ids.has(option.optionId))
  return match?.paletteId ?? options[0]?.paletteId ?? ''
}

export function remapLibraryColorOptionId(
  options: FlattenedLibraryColor[],
  toPaletteId: string,
  optionId: string,
): string {
  const toColors = options.filter((option) => option.paletteId === toPaletteId)
  if (toColors.some((option) => option.optionId === optionId)) return optionId
  const from = options.find((option) => option.optionId === optionId)
  return toColors.find((option) => option.slot === from?.slot)?.optionId ?? toColors[0]?.optionId ?? ''
}

export function libraryPaletteColorValues(
  items: Array<{ id: string; palette: WebsiteColorLibraryPalette }>,
  paletteId: string,
): string[] {
  const palette =
    items.find((item) => item.id === paletteId)?.palette ??
    (!paletteId ? items[0]?.palette : undefined)
  return palette?.colors.slice(0, COLOR_LIBRARY_PALETTE_MAX_COLORS).map((entry) => entry.value) ?? []
}

export function flattenColorLibraryPalettes(
  items: Array<{ id: string; name: string; palette: WebsiteColorLibraryPalette }>,
): FlattenedLibraryColor[] {
  return items.flatMap((item) =>
    item.palette.colors.slice(0, COLOR_LIBRARY_PALETTE_MAX_COLORS).map((entry, index) => ({
      optionId: `${item.id}:color_${index + 1}`,
      paletteId: item.id,
      paletteName: item.name,
      slot: index + 1,
      colorName: entry.name,
      value: normalizePaletteHex(entry.value),
    })),
  )
}

import type { ThemePaletteSelectOption } from './websitePalette'

export function paletteDisplayName(
  paletteOptions: ThemePaletteSelectOption[],
  paletteId: string,
  inheritLabel: string,
): string {
  const trimmed = paletteId.trim()
  if (!trimmed) return inheritLabel
  return paletteOptions.find((entry) => entry.id === trimmed)?.name ?? '—'
}

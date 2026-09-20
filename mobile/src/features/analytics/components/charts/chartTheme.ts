import { useThemeColors } from '@webonone/mobile-ui'

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function useChartTheme() {
  const colors = useThemeColors()
  return {
    primary: colors.primary,
    profit: colors.success,
    muted: colors.textMuted,
    foreground: colors.text,
    grid: colors.border,
    track: colors.borderLight,
    slices: [
      colors.primary,
      withAlpha(colors.primary, 0.75),
      withAlpha(colors.primary, 0.5),
      colors.textMuted,
      withAlpha(colors.primary, 0.35),
    ],
  }
}

export function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    const compact = value / 1000
    return `${compact >= 10 ? compact.toFixed(0) : compact.toFixed(1)}k`
  }
  return String(Math.round(value))
}

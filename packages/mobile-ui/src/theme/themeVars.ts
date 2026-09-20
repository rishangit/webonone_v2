import {
  DARK_CANVAS_BASE,
  LIGHT_CANVAS_BASE,
  SHELL_CHROME_BG,
  SHELL_CHROME_BORDER,
  deriveInputBackgroundHex,
  hslToHex,
  type ColorMode,
  type SemanticColors,
} from '@webonone/theme'

function hslComponentsToHex(value: string): string {
  const [hue, sat, light] = value.split(/\s+/)
  return hslToHex(
    Number(hue),
    Number((sat ?? '0').replace('%', '')),
    Number((light ?? '0').replace('%', '')),
  )
}

export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw
  const value = Number.parseInt(full.slice(0, 6), 16)
  if (Number.isNaN(value)) return `rgba(37, 99, 235, ${alpha})`
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

/** Page canvas — fixed neutrals from @webonone/theme (matches web `.theme-canvas`), not theme color4. */
export function derivePageBackgroundHex(colorMode: ColorMode): string {
  return hslComponentsToHex(colorMode === 'light' ? LIGHT_CANVAS_BASE : DARK_CANVAS_BASE)
}

/** Neutral glass card fill — matches web `.glass-card` (`--glass-bg`), not theme surface. */
export function deriveCardBackgroundHex(colorMode: ColorMode): string {
  if (colorMode === 'light') {
    return '#FFFFFF'
  }
  return hslComponentsToHex(SHELL_CHROME_BG.dark)
}

const INPUT_BORDER_OPACITY: Record<ColorMode, number> = {
  light: 0.22,
  dark: 0.38,
}

export function semanticColorsToVars(colors: SemanticColors, colorMode: ColorMode): Record<`--${string}`, string> {
  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-background': derivePageBackgroundHex(colorMode),
    '--color-surface': colors.surface,
    '--color-card': deriveCardBackgroundHex(colorMode),
    '--color-foreground': colors.text,
    '--color-title': colors.textTitle,
    '--color-muted': colors.textMuted,
    '--color-border': colors.border,
    '--color-input-border': hexToRgba(colors.primary, INPUT_BORDER_OPACITY[colorMode]),
    '--color-destructive': colors.error,
    '--color-primary-text': colors.primaryText,
    '--color-secondary-text': colors.secondaryText,
    '--color-shell': hslComponentsToHex(SHELL_CHROME_BG[colorMode]),
    '--color-shell-border': hslComponentsToHex(SHELL_CHROME_BORDER[colorMode]),
    '--color-input': deriveInputBackgroundHex(colors.primary, colorMode),
  }
}

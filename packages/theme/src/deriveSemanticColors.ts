import {
  alpha,
  brightenForDarkSurface,
  darken,
  hexToHsl,
  hslToHex,
  lighten,
  mix,
  pickContrastingText,
} from './colorUtils'
import type { ColorMode, SemanticColors, ThemeColors } from './types'
import { FIXED_TYPOGRAPHY } from './constants'

const STATUS_BASE = {
  success: '#2E9B63',
  warning: '#D99A22',
  error: '#D9534F',
  info: '#3787C8',
} as const

function deriveStatusTokens(
  base: string,
  surface: string,
  mode: ColorMode,
): { color: string; background: string; border: string } {
  const color = mode === 'dark' ? lighten(base, 8) : base
  const background = mode === 'dark' ? alpha(color, 0.16) : alpha(color, 0.12)
  const border = mode === 'dark' ? mix(surface, color, 0.45) : mix(surface, color, 0.35)
  return { color, background, border }
}

function deriveDarkPalette(base: ThemeColors): ThemeColors {
  const { h, s } = hexToHsl(base.background)
  const darkBackground = hslToHex(h, Math.min(28, s * 0.35 + 8), 7)
  const darkSurface = hslToHex(h, Math.min(24, s * 0.3 + 6), 12)
  const darkPrimary = brightenForDarkSurface(base.primary, darkSurface)
  const darkSecondary = brightenForDarkSurface(base.secondary, darkSurface)

  return {
    primary: darkPrimary,
    secondary: darkSecondary,
    background: darkBackground,
    surface: darkSurface,
    text: base.text,
  }
}

function fixedTypography(mode: ColorMode) {
  return FIXED_TYPOGRAPHY[mode]
}

function buildSemanticFromResolved(colors: ThemeColors, mode: ColorMode): SemanticColors {
  const primary = colors.primary
  const secondary = colors.secondary
  const background = colors.background
  const surface = colors.surface
  const typography = fixedTypography(mode)
  const text = typography.body
  const textTitle = typography.title
  const textDescription = typography.description
  const textLabel = typography.label

  const primaryHover = mode === 'light' ? darken(primary, 8) : lighten(primary, 6)
  const primaryActive = mode === 'light' ? darken(primary, 14) : lighten(primary, 10)
  const primaryLight = mix(primary, surface, mode === 'light' ? 0.82 : 0.72)
  const primaryText = pickContrastingText(primary)

  const secondaryHover = mode === 'light' ? darken(secondary, 8) : lighten(secondary, 6)
  const secondaryActive = mode === 'light' ? darken(secondary, 14) : lighten(secondary, 10)
  const secondaryLight = mix(secondary, surface, mode === 'light' ? 0.82 : 0.72)
  const secondaryText = pickContrastingText(secondary)

  const surfaceHover = mode === 'light' ? mix(surface, primary, 0.06) : lighten(surface, 4)
  const surfaceActive = mode === 'light' ? mix(surface, primary, 0.1) : lighten(surface, 7)
  const surfaceSelected = mix(surface, primary, mode === 'light' ? 0.12 : 0.18)

  const textSecondary = typography.label
  const textMuted = typography.muted
  const textDisabled = typography.disabled

  const border = mix(surface, text, mode === 'light' ? 0.14 : 0.22)
  const borderLight = mix(surface, text, mode === 'light' ? 0.08 : 0.14)
  const borderStrong = mix(surface, text, mode === 'light' ? 0.24 : 0.32)
  const borderHover = mix(surface, primary, mode === 'light' ? 0.28 : 0.35)
  const borderFocus = primary
  const divider = borderLight

  const focus = alpha(primary, mode === 'light' ? 0.35 : 0.45)
  const selection = alpha(primary, mode === 'light' ? 0.2 : 0.28)

  const success = deriveStatusTokens(STATUS_BASE.success, surface, mode)
  const warning = deriveStatusTokens(STATUS_BASE.warning, surface, mode)
  const error = deriveStatusTokens(STATUS_BASE.error, surface, mode)
  const info = deriveStatusTokens(STATUS_BASE.info, surface, mode)

  return {
    primary,
    primaryHover,
    primaryActive,
    primaryLight,
    primaryText,

    secondary,
    secondaryHover,
    secondaryActive,
    secondaryLight,
    secondaryText,

    background,
    surface,
    surfaceHover,
    surfaceActive,
    surfaceSelected,

    text,
    textTitle,
    textDescription,
    textLabel,
    textSecondary,
    textMuted,
    textDisabled,

    border,
    borderLight,
    borderStrong,
    borderHover,
    borderFocus,
    divider,

    focus,
    selection,

    success: success.color,
    successBackground: success.background,
    successBorder: success.border,

    warning: warning.color,
    warningBackground: warning.background,
    warningBorder: warning.border,

    error: error.color,
    errorBackground: error.background,
    errorBorder: error.border,

    info: info.color,
    infoBackground: info.background,
    infoBorder: info.border,
  }
}

/** Derive the full semantic palette for the given base colors and color mode. */
export function deriveSemanticColors(base: ThemeColors, mode: ColorMode): SemanticColors {
  const resolved = mode === 'dark' ? deriveDarkPalette(base) : base
  return buildSemanticFromResolved(resolved, mode)
}

/** Convert semantic color keys to CSS custom property names. */
export function semanticColorToCssVar(key: keyof SemanticColors): string {
  return `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
}

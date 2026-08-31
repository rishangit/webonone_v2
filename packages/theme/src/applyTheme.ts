import type { ColorMode, ThemeDto, ThemePayload } from './types'
import {
  DARK_CANVAS_BASE,
  DARK_CANVAS_TINT,
  DARK_CANVAS_TINT_OPACITY,
  LIGHT_CANVAS_BASE,
  LIGHT_CANVAS_TINT,
  LIGHT_CANVAS_TINT_OPACITY,
  SHELL_CHROME_BG,
  SHELL_CHROME_BORDER,
} from './constants'
import { persistAppliedTheme } from './themeSession'
import {
  deriveInputBackgroundHex,
  deriveMenuBackgroundHex,
  hexToHslComponents,
  pickForegroundHex,
} from './colorUtils'
import { deriveSemanticColors, semanticColorToCssVar } from './deriveSemanticColors'
import { themeDtoToColors } from './themeMapper'
import type { SemanticColors } from './types'

/** Frosted surface fill over the tinted canvas. */
const GLASS_SURFACE_OPACITY = 0.78

/** Menus / popovers — lighter wash of the surface with a stronger opaque tint. */
const MENU_SURFACE_OPACITY = 0.94

const BACKGROUND_BASE: Record<ColorMode, string> = {
  light: LIGHT_CANVAS_BASE,
  dark: DARK_CANVAS_BASE,
}

export function applyColorMode(mode: ColorMode, root: HTMLElement = document.documentElement): void {
  root.classList.toggle('dark', mode === 'dark')
}

function applySemanticCssVars(semantic: SemanticColors, root: HTMLElement): void {
  for (const [key, value] of Object.entries(semantic) as [keyof SemanticColors, string][]) {
    root.style.setProperty(semanticColorToCssVar(key), value)
  }
}

function applyLegacyBridge(semantic: SemanticColors, colorMode: ColorMode, root: HTMLElement): void {
  const backgroundHsl = hexToHslComponents(semantic.background)
  const surfaceHsl = hexToHslComponents(semantic.surface)
  const foregroundHsl = hexToHslComponents(semantic.text)
  const mutedForegroundHsl = hexToHslComponents(semantic.textMuted)
  const primaryHsl = hexToHslComponents(semantic.primary)
  const secondaryHsl = hexToHslComponents(semantic.secondary)
  const primaryTextHsl = hexToHslComponents(semantic.primaryText)
  const primaryHoverHsl = hexToHslComponents(semantic.primaryHover)
  const borderHsl = hexToHslComponents(semantic.border)
  const borderFocusHsl = hexToHslComponents(semantic.borderFocus)
  const errorHsl = hexToHslComponents(semantic.error)

  const canvasBase = BACKGROUND_BASE[colorMode]
  const canvasTint = colorMode === 'dark' ? DARK_CANVAS_TINT : LIGHT_CANVAS_TINT
  const canvasTintOpacity =
    colorMode === 'dark' ? DARK_CANVAS_TINT_OPACITY : LIGHT_CANVAS_TINT_OPACITY
  const glassSurface = `${surfaceHsl} / ${GLASS_SURFACE_OPACITY}`
  const menuBackgroundHsl = hexToHslComponents(
    deriveMenuBackgroundHex(semantic.surface, colorMode),
  )
  const menuSurface = `${menuBackgroundHsl} / ${MENU_SURFACE_OPACITY}`
  const inputBackgroundHsl = hexToHslComponents(
    deriveInputBackgroundHex(semantic.primary, colorMode),
  )
  const inputBorderOpacity = colorMode === 'light' ? 0.22 : 0.38

  root.style.setProperty('--background-base', canvasBase)
  root.style.setProperty('--background-tint', canvasTint)
  root.style.setProperty('--background-tint-opacity', String(canvasTintOpacity))
  root.style.setProperty('--background', `${backgroundHsl} / ${GLASS_SURFACE_OPACITY}`)
  root.style.setProperty('--card', glassSurface)
  root.style.setProperty('--menu-bg', menuSurface)
  root.style.setProperty('--popover', menuSurface)
  root.style.setProperty('--foreground', foregroundHsl)
  root.style.setProperty('--card-foreground', foregroundHsl)
  root.style.setProperty('--popover-foreground', foregroundHsl)
  root.style.setProperty('--muted', `${backgroundHsl} / 0.42`)
  root.style.setProperty('--muted-foreground', mutedForegroundHsl)
  root.style.setProperty('--input-background', inputBackgroundHsl)
  root.style.setProperty('--input', `${primaryHsl} / ${inputBorderOpacity}`)
  root.style.setProperty('--border', borderHsl)

  root.style.setProperty(
    '--glass-bg',
    colorMode === 'light' ? '0 0% 100% / 0.85' : SHELL_CHROME_BG.dark,
  )
  root.style.setProperty(
    '--glass-border',
    colorMode === 'light' ? `${foregroundHsl} / 0.1` : `${foregroundHsl} / 0.22`,
  )
  root.style.setProperty('--glass-shadow', colorMode === 'light' ? '0 0% 0% / 0.1' : '0 0% 0% / 0.25')
  root.style.setProperty('--shell-chrome-bg', SHELL_CHROME_BG[colorMode])
  root.style.setProperty('--shell-chrome-border', SHELL_CHROME_BORDER[colorMode])

  root.style.setProperty('--accent-primary', primaryHsl)
  root.style.setProperty('--accent-secondary', hexToHslComponents(semantic.secondary))
  root.style.setProperty('--accent-primary-hover', primaryHoverHsl)
  root.style.setProperty('--accent-button-text', primaryTextHsl)

  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--primary-gradient-from', secondaryHsl)
  root.style.setProperty('--primary-gradient-to', primaryHsl)
  root.style.setProperty('--primary-foreground', primaryTextHsl)

  root.style.setProperty('--secondary', secondaryHsl)
  root.style.setProperty(
    '--secondary-foreground',
    hexToHslComponents(pickForegroundHex(semantic.secondary)),
  )

  root.style.setProperty('--accent', hexToHslComponents(semantic.surfaceHover))
  root.style.setProperty(
    '--accent-foreground',
    hexToHslComponents(semantic.text),
  )

  root.style.setProperty('--destructive', errorHsl)
  root.style.setProperty(
    '--destructive-foreground',
    hexToHslComponents(pickForegroundHex(semantic.error)),
  )

  root.style.setProperty('--ring', borderFocusHsl)
  root.style.setProperty('--scrollbar-thumb', `${borderFocusHsl} / 0.6`)
}

export function applyThemeVariables(
  payload: Pick<ThemePayload, 'theme' | 'colorMode'>,
  root: HTMLElement = document.documentElement,
): void {
  const { theme, colorMode } = payload
  const baseColors = themeDtoToColors(theme)

  // Legacy palette slot vars (semantic mapping documented in types.ts)
  root.style.setProperty('--color-1', theme.color1)
  root.style.setProperty('--color-2', theme.color2)
  root.style.setProperty('--color-3', theme.color3)
  root.style.setProperty('--color-4', theme.color4)
  root.style.setProperty('--color-5', theme.color5)

  const semantic = deriveSemanticColors(baseColors, colorMode)
  applySemanticCssVars(semantic, root)
  applyLegacyBridge(semantic, colorMode, root)

  applyColorMode(colorMode, root)
  if (root === document.documentElement) {
    persistAppliedTheme(buildThemePayload(theme, colorMode))
  }
}

export function buildThemePayload(theme: ThemeDto, colorMode: ColorMode): ThemePayload {
  return { version: 2, theme, colorMode }
}

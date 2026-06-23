import type { ColorMode, ThemeDto, ThemePayload } from './types'
import { PLATFORM_DESTRUCTIVE_HEX } from './constants'
import {
  deriveDarkenedHex,
  deriveInputBackgroundHex,
  deriveMenuBackgroundHex,
  hexToHslComponents,
  pickForegroundHex,
  resolveSurfaceColors,
} from './colorUtils'

/** Theme tint strength on the site canvas (color4 / color5 slot). */
const SITE_TINT_OPACITY: Record<ColorMode, number> = {
  light: 0.16,
  dark: 0.24,
}

/** Frosted surface fill over the tinted canvas. */
const GLASS_SURFACE_OPACITY = 0.78

/** Menus / popovers — lighter wash of the surface with a stronger opaque tint. */
const MENU_SURFACE_OPACITY = 0.94

const BACKGROUND_BASE: Record<ColorMode, string> = {
  light: '0 0% 100%',
  dark: '240 10% 4%',
}

export function applyColorMode(mode: ColorMode, root: HTMLElement = document.documentElement): void {
  root.classList.toggle('dark', mode === 'dark')
}

export function applyThemeVariables(
  payload: Pick<ThemePayload, 'theme' | 'colorMode'>,
  root: HTMLElement = document.documentElement,
): void {
  const { theme, colorMode } = payload
  const colors = [theme.color1, theme.color2, theme.color3, theme.color4, theme.color5]

  colors.forEach((hex, index) => {
    root.style.setProperty(`--color-${index + 1}`, hex)
  })

  const { background, foreground } = resolveSurfaceColors(
    theme.color1,
    theme.color4,
    theme.color5,
    colorMode,
  )
  const backgroundHsl = hexToHslComponents(background)
  const foregroundHsl = hexToHslComponents(foreground)
  const tintOpacity = SITE_TINT_OPACITY[colorMode]
  const glassSurface = `${backgroundHsl} / ${GLASS_SURFACE_OPACITY}`
  const menuBackgroundHsl = hexToHslComponents(deriveMenuBackgroundHex(background, colorMode))
  const menuSurface = `${menuBackgroundHsl} / ${MENU_SURFACE_OPACITY}`

  root.style.setProperty('--background-base', BACKGROUND_BASE[colorMode])
  root.style.setProperty('--background-tint', backgroundHsl)
  root.style.setProperty('--background-tint-opacity', String(tintOpacity))
  root.style.setProperty('--background', glassSurface)
  root.style.setProperty('--card', glassSurface)
  root.style.setProperty('--menu-bg', menuSurface)
  root.style.setProperty('--popover', menuSurface)
  root.style.setProperty('--foreground', foregroundHsl)
  root.style.setProperty('--card-foreground', foregroundHsl)
  root.style.setProperty('--popover-foreground', foregroundHsl)
  root.style.setProperty('--muted', `${backgroundHsl} / 0.42`)
  root.style.setProperty('--muted-foreground', `${foregroundHsl} / 0.7`)
  const primaryHsl = hexToHslComponents(theme.color1)
  const inputBackgroundHsl = hexToHslComponents(deriveInputBackgroundHex(theme.color1, colorMode))
  const inputBorderOpacity = colorMode === 'light' ? 0.22 : 0.38

  root.style.setProperty('--input-background', inputBackgroundHsl)
  root.style.setProperty('--input', `${primaryHsl} / ${inputBorderOpacity}`)

  const accentPrimaryHsl = hexToHslComponents(theme.color1)
  const accentSecondaryHsl = hexToHslComponents(theme.color3)
  const accentPrimaryHoverHsl = hexToHslComponents(deriveDarkenedHex(theme.color1, -10))
  const accentButtonTextHsl = hexToHslComponents(pickForegroundHex(theme.color1, theme.color3))

  root.style.setProperty('--glass-bg', colorMode === 'light' ? '0 0% 100% / 0.85' : `${backgroundHsl} / 0.8`)
  root.style.setProperty(
    '--glass-border',
    colorMode === 'light' ? `${foregroundHsl} / 0.1` : `${foregroundHsl} / 0.22`,
  )
  root.style.setProperty('--glass-shadow', colorMode === 'light' ? '0 0% 0% / 0.1' : '0 0% 0% / 0.25')

  root.style.setProperty('--accent-primary', accentPrimaryHsl)
  root.style.setProperty('--accent-secondary', accentSecondaryHsl)
  root.style.setProperty('--accent-primary-hover', accentPrimaryHoverHsl)
  root.style.setProperty('--accent-button-text', accentButtonTextHsl)

  root.style.setProperty('--primary', accentPrimaryHsl)
  root.style.setProperty('--primary-gradient-from', accentSecondaryHsl)
  root.style.setProperty('--primary-gradient-to', accentPrimaryHsl)
  root.style.setProperty('--primary-foreground', accentButtonTextHsl)

  root.style.setProperty('--secondary', hexToHslComponents(theme.color2))
  root.style.setProperty('--secondary-foreground', hexToHslComponents(pickForegroundHex(theme.color2)))

  root.style.setProperty('--accent', hexToHslComponents(theme.color3))
  root.style.setProperty('--accent-foreground', hexToHslComponents(pickForegroundHex(theme.color3)))

  root.style.setProperty('--destructive', hexToHslComponents(PLATFORM_DESTRUCTIVE_HEX))
  root.style.setProperty(
    '--destructive-foreground',
    hexToHslComponents(pickForegroundHex(PLATFORM_DESTRUCTIVE_HEX)),
  )

  root.style.setProperty('--ring', hexToHslComponents(theme.color3))
  root.style.setProperty('--scrollbar-thumb', `${hexToHslComponents(theme.color3)} / 0.6`)

  applyColorMode(colorMode, root)
}

export function buildThemePayload(theme: ThemeDto, colorMode: ColorMode): ThemePayload {
  return { version: 1, theme, colorMode }
}

import type { ColorMode } from './types'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

type Hsl = { h: number; s: number; l: number }

function parseHexChannels(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').toUpperCase()
  return [
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255,
  ]
}

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = parseHexChannels(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6
        break
      case g:
        h = (b - r) / delta + 2
        break
      default:
        h = (r - g) / delta + 4
        break
    }
    h *= 60
    if (h < 0) h += 360
  }

  return { h, s: s * 100, l: l * 100 }
}

export function hexToHslComponents(hex: string): string {
  const { h, s, l } = hexToHsl(hex)
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toByte = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toByte(r)}${toByte(g)}${toByte(b)}`.toUpperCase()
}

export function lighten(hex: string, amount: number): string {
  const { h, s, l } = hexToHsl(hex)
  return hslToHex(h, s, Math.min(100, l + amount))
}

export function darken(hex: string, amount: number): string {
  const { h, s, l } = hexToHsl(hex)
  return hslToHex(h, s, Math.max(0, l - amount))
}

/** @deprecated Use darken() */
export function deriveDarkenedHex(hex: string, lightnessDelta = -8): string {
  return lighten(hex, lightnessDelta)
}

export function mix(hexA: string, hexB: string, ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio))
  const [r1, g1, b1] = parseHexChannels(hexA).map((c) => c * 255)
  const [r2, g2, b2] = parseHexChannels(hexB).map((c) => c * 255)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
}

export function alpha(hex: string, opacity: number): string {
  const [r, g, b] = parseHexChannels(hex).map((c) => Math.round(c * 255))
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`
}

function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '')
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(normalized.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex)
  const l2 = relativeLuminance(bgHex)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastLevel = 'AA' | 'AAA'

const CONTRAST_THRESHOLDS: Record<ContrastLevel, number> = {
  AA: 4.5,
  AAA: 7,
}

export function meetsContrast(
  fgHex: string,
  bgHex: string,
  level: ContrastLevel = 'AA',
): boolean {
  return contrastRatio(fgHex, bgHex) >= CONTRAST_THRESHOLDS[level]
}

export function pickContrastingText(bgHex: string): string {
  return pickForegroundHex(bgHex)
}

export function pickForegroundHex(...hexes: string[]): string {
  const darkest = hexes.reduce((a, b) => (relativeLuminance(a) < relativeLuminance(b) ? a : b))
  return relativeLuminance(darkest) > 0.45 ? '#1A1A1A' : '#FFFFFF'
}

/** Ensure foreground has sufficient contrast on background; brighten/darken as needed. */
export function ensureContrast(fgHex: string, bgHex: string, level: ContrastLevel = 'AA'): string {
  if (meetsContrast(fgHex, bgHex, level)) return fgHex

  const { h, s, l } = hexToHsl(fgHex)
  const bgL = hexToHsl(bgHex).l
  const step = bgL > 50 ? -4 : 4

  for (let i = 0; i < 20; i += 1) {
    const candidate = hslToHex(h, s, Math.max(0, Math.min(100, l + step * (i + 1))))
    if (meetsContrast(candidate, bgHex, level)) return candidate
  }

  return pickContrastingText(bgHex)
}

/** Brighten a brand color until it meets contrast on a dark surface. */
export function brightenForDarkSurface(hex: string, surfaceHex: string): string {
  if (meetsContrast(hex, surfaceHex)) return hex
  const { h, s, l } = hexToHsl(hex)
  for (let lift = 4; lift <= 40; lift += 4) {
    const candidate = hslToHex(h, Math.min(100, s + lift * 0.3), Math.min(78, l + lift))
    if (meetsContrast(candidate, surfaceHex)) return candidate
  }
  return lighten(hex, 24)
}

/** Light wash of the brand color for text fields. */
export function deriveInputBackgroundHex(brandHex: string, colorMode: ColorMode): string {
  const { h, s } = hexToHsl(brandHex)
  if (colorMode === 'light') {
    const tintedSat = Math.min(44, Math.max(14, s * 0.34))
    return hslToHex(h, tintedSat, 97)
  }
  const tintedSat = Math.min(40, Math.max(12, s * 0.4))
  return hslToHex(h, tintedSat, 17)
}

/** Light frosted panel fill for dropdowns, selects, and popovers. */
export function deriveMenuBackgroundHex(surfaceHex: string, colorMode: ColorMode): string {
  const { h, s, l } = hexToHsl(surfaceHex)
  if (colorMode === 'light') {
    const tintedSat = Math.min(52, Math.max(18, s * 0.58))
    const tintedL = Math.min(92, Math.max(84, l - 8))
    return hslToHex(h, tintedSat, tintedL)
  }
  const tintedSat = Math.min(32, Math.max(10, s * 0.35))
  const liftedL = Math.min(34, Math.max(20, l + 14))
  return hslToHex(h, tintedSat, liftedL)
}

/** Near-black body/heading text with the brand hue (light mode). */
export function deriveDarkBrandTextHex(brandHex: string): string {
  const { h, s } = hexToHsl(brandHex)
  const tintedSat = Math.min(55, Math.max(18, s * 0.55))
  return hslToHex(h, tintedSat, 11)
}

/** Near-white body/heading text with the brand hue (dark mode). */
export function deriveLightBrandTextHex(brandHex: string): string {
  const { h, s } = hexToHsl(brandHex)
  const tintedSat = Math.min(28, Math.max(8, s * 0.25))
  return hslToHex(h, tintedSat, 96)
}

export function resolveBrandTextHex(brandHex: string, colorMode: ColorMode): string {
  return colorMode === 'dark' ? deriveLightBrandTextHex(brandHex) : deriveDarkBrandTextHex(brandHex)
}

export function hexToHslCssVar(hex: string): string {
  return hexToHslComponents(hex)
}

/** @deprecated Use themeDtoToColors + deriveSemanticColors */
export function resolveSurfaceColors(
  color1: string,
  color4: string,
  color5: string,
  colorMode: ColorMode,
): { background: string; foreground: string } {
  return {
    background: colorMode === 'dark' ? color5 : color4,
    foreground: resolveBrandTextHex(color1, colorMode),
  }
}

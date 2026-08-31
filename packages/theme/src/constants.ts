import type { ThemeDto, ColorMode } from './types'

export const THEME_MESSAGE_TYPES = {
  APPLY: 'webonone:theme:apply',
  READY: 'webonone:theme:ready',
} as const

export const THEME_QUERY = {
  V: 'theme_v',
  MODE: 'theme_mode',
  COLORS: 'theme_colors',
  NAME: 'theme_name',
} as const

export const THEME_CONTRACT_VERSION = '2'
export const THEME_CONTRACT_VERSION_V1 = '1'

/** Platform-fixed destructive — not a palette slot (palette generators do not assign roles). */
export const PLATFORM_DESTRUCTIVE_HEX = '#DC2626'

/** App shell header + sidebar — fixed neutrals; never derived from theme palette slots. */
export const SHELL_CHROME_BG: Record<'light' | 'dark', string> = {
  light: '240 5% 96%',
  dark: '240 4% 16%',
}

export const SHELL_CHROME_BORDER: Record<'light' | 'dark', string> = {
  light: '240 6% 88%',
  dark: '240 4% 22%',
}

/** Light page canvas — same neutral family as shell chrome, slightly lighter than header/sidebar. */
export const LIGHT_CANVAS_BASE = '240 5% 98%'
export const LIGHT_CANVAS_TINT = '240 5% 96%'
export const LIGHT_CANVAS_TINT_OPACITY = 0.16

/** Dark page canvas — same neutral family as shell chrome, slightly lighter than header/sidebar. */
export const DARK_CANVAS_BASE = '240 4% 20%'
export const DARK_CANVAS_TINT = '240 4% 22%'
export const DARK_CANVAS_TINT_OPACITY = 0.16

/**
 * Fixed typography neutrals — not derived from the user text palette slot.
 * Titles use dark/light body copy; descriptions and labels use ash tones.
 */
export const FIXED_TYPOGRAPHY: Record<
  ColorMode,
  {
    title: string
    body: string
    description: string
    label: string
    muted: string
    disabled: string
  }
> = {
  light: {
    title: '#17211D',
    body: '#17211D',
    description: '#6B7280',
    label: '#4B5563',
    muted: '#9CA3AF',
    disabled: '#C4C9CF',
  },
  dark: {
    title: '#F1F5F3',
    body: '#E8EDEA',
    description: '#9CA3AF',
    label: '#B0B8B3',
    muted: '#7A8680',
    disabled: '#5C6560',
  },
}

export const PLATFORM_DEFAULT_THEME: Omit<ThemeDto, 'id'> = {
  name: 'Platform Default',
  color1: '#344CE2', // primary
  color2: '#3578E8', // secondary
  color3: '#17211D', // text
  color4: '#EFF3FA', // background
  color5: '#FFFFFF', // surface
}

export const PLATFORM_DEFAULT_THEME_ID = 'platform-default-theme'

export function createPlatformDefaultThemeDto(): ThemeDto {
  return { id: PLATFORM_DEFAULT_THEME_ID, ...PLATFORM_DEFAULT_THEME }
}

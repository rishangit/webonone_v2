import type { ThemeDto } from './types'

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

export const THEME_CONTRACT_VERSION = '1'

/** Platform-fixed destructive — not a palette slot (palette generators do not assign roles). */
export const PLATFORM_DESTRUCTIVE_HEX = '#DC2626'

export const PLATFORM_DEFAULT_THEME: Omit<ThemeDto, 'id'> = {
  name: 'Platform Default',
  color1: '#344CE2',
  color2: '#3578E8',
  color3: '#3578E8',
  color4: '#EFF3FA',
  color5: '#0E2F59',
}

export const PLATFORM_DEFAULT_THEME_ID = 'platform-default-theme'

export function createPlatformDefaultThemeDto(): ThemeDto {
  return { id: PLATFORM_DEFAULT_THEME_ID, ...PLATFORM_DEFAULT_THEME }
}

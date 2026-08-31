export const platformDefaultFormValues = {
  name: 'My Theme',
  primary: '#344CE2',
  secondary: '#3578E8',
  background: '#EFF3FA',
  surface: '#FFFFFF',
  text: '#17211D',
} as const

export const THEME_COLOR_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  background: 'Background',
  surface: 'Surface',
  text: 'Text',
} as const

export const THEME_COLOR_KEYS = ['primary', 'secondary', 'background', 'surface', 'text'] as const

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number]

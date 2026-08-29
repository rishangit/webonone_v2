export const UI_THEME_IDS = ['classic', 'high-tech'] as const

export type UiThemeId = (typeof UI_THEME_IDS)[number]

export const DEFAULT_UI_THEME: UiThemeId = 'classic'

export const UI_THEME_QUERY = 'ui_theme'

export const UI_THEME_MESSAGE_TYPES = {
  APPLY: 'webonone:ui-theme:apply',
} as const

export const UI_THEME_CHANGE_EVENT = 'webonone:ui-theme-change'

export const UI_THEMES: ReadonlyArray<{ id: UiThemeId; labelKey: string }> = [
  { id: 'classic', labelKey: 'appearance.uiTheme.classic' },
  { id: 'high-tech', labelKey: 'appearance.uiTheme.highTech' },
]

export function isUiThemeId(value: unknown): value is UiThemeId {
  return typeof value === 'string' && (UI_THEME_IDS as readonly string[]).includes(value)
}

export function themeNeedsShapeDom(theme: UiThemeId): boolean {
  return theme === 'high-tech'
}

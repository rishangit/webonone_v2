export type UiThemeId = 'classic' | 'high-tech'

export const DEFAULT_UI_THEME: UiThemeId = 'classic'

export function themeNeedsShapeDom(theme: UiThemeId): boolean {
  return theme === 'high-tech'
}

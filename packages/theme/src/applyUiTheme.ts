import { DEFAULT_UI_THEME, type UiThemeId } from './uiThemeConstants'
import { parseUiTheme } from './uiThemeUrl'

export function applyUiTheme(
  theme: UiThemeId,
  root: HTMLElement = document.documentElement,
): void {
  root.dataset.uiTheme = theme
}

export function applyUiThemeFromValue(
  value: unknown,
  root: HTMLElement = document.documentElement,
): UiThemeId {
  const theme = parseUiTheme(value) ?? DEFAULT_UI_THEME
  applyUiTheme(theme, root)
  return theme
}

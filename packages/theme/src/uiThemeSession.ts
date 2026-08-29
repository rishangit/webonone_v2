import {
  DEFAULT_UI_THEME,
  UI_THEME_CHANGE_EVENT,
  type UiThemeId,
} from './uiThemeConstants'
import { parseUiTheme } from './uiThemeUrl'

const SESSION_KEY = 'webonone:ui-theme'

export function persistUiTheme(theme: UiThemeId): void {
  try {
    sessionStorage.setItem(SESSION_KEY, theme)
  } catch {
    // ignore quota / private mode
  }

  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(UI_THEME_CHANGE_EVENT, { detail: theme }))
}

export function readPersistedUiTheme(): UiThemeId | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return parseUiTheme(raw)
  } catch {
    return null
  }
}

export function subscribeUiTheme(onChange: (theme: UiThemeId) => void): () => void {
  function handle(event: Event) {
    const detail = (event as CustomEvent<unknown>).detail
    const parsed = parseUiTheme(detail)
    if (parsed) {
      onChange(parsed)
    }
  }

  window.addEventListener(UI_THEME_CHANGE_EVENT, handle)
  return () => window.removeEventListener(UI_THEME_CHANGE_EVENT, handle)
}

export { DEFAULT_UI_THEME }

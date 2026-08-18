import type { WebsiteTheme } from '../types'

const storageKey = (themeId: string) => `webonone-design-theme-draft:${themeId}`

export function writeThemeDraft(theme: WebsiteTheme): void {
  sessionStorage.setItem(storageKey(theme.id), JSON.stringify(theme))
}

export function readThemeDraft(themeId: string): WebsiteTheme | null {
  try {
    const raw = sessionStorage.getItem(storageKey(themeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as WebsiteTheme
    return parsed?.id === themeId ? parsed : null
  } catch {
    return null
  }
}

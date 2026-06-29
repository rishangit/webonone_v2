import type { ThemePayload } from './types'

const APPLIED_THEME_SESSION_KEY = 'webonone:applied-theme'

function isThemePayload(value: unknown): value is ThemePayload {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as ThemePayload
  return candidate.version === 1 && typeof candidate.colorMode === 'string'
}

export function persistAppliedTheme(payload: ThemePayload): void {
  try {
    sessionStorage.setItem(APPLIED_THEME_SESSION_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

export function readPersistedTheme(): ThemePayload | null {
  try {
    const raw = sessionStorage.getItem(APPLIED_THEME_SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isThemePayload(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearPersistedTheme(): void {
  try {
    sessionStorage.removeItem(APPLIED_THEME_SESSION_KEY)
  } catch {
    // ignore
  }
}

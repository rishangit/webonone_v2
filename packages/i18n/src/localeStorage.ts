import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type AppLocale,
} from './constants'

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Normalize free-text / BCP-47 tags to a supported app locale.
 * Unknown values fall back to English.
 */
export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) return DEFAULT_LOCALE
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return DEFAULT_LOCALE
  if (isAppLocale(trimmed)) return trimmed
  const primary = trimmed.split(/[-_]/)[0]
  if (primary && isAppLocale(primary)) return primary
  return DEFAULT_LOCALE
}

export function getStoredLocale(): AppLocale | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (!raw) return null
    return normalizeLocale(raw)
  } catch {
    return null
  }
}

export function setStoredLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore quota / private mode
  }
}

export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const candidates = [...(navigator.languages ?? []), navigator.language]
  for (const candidate of candidates) {
    if (!candidate) continue
    const normalized = normalizeLocale(candidate)
    if (normalized !== DEFAULT_LOCALE || candidate.toLowerCase().startsWith('en')) {
      return normalized
    }
  }
  return DEFAULT_LOCALE
}

export function resolveInitialLocale(explicit?: string | null): AppLocale {
  if (explicit) return normalizeLocale(explicit)
  return getStoredLocale() ?? detectBrowserLocale()
}

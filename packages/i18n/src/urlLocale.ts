import {
  DEFAULT_LOCALE,
  LOCALE_QUERY,
  type AppLocale,
} from './constants'
import { getStoredLocale, normalizeLocale, setStoredLocale } from './localeStorage'

export function serializeLocaleQueryParams(locale: AppLocale): Record<string, string> {
  return { [LOCALE_QUERY]: locale }
}

export function parseLocaleQueryParam(searchParams: URLSearchParams): AppLocale | null {
  const raw = searchParams.get(LOCALE_QUERY)
  if (!raw) return null
  return normalizeLocale(raw)
}

export function stripLocaleQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(searchParams)
  params.delete(LOCALE_QUERY)
  return params
}

export function relayLocaleQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const fromQuery = parseLocaleQueryParam(searchParams)
  if (fromQuery) {
    return serializeLocaleQueryParams(fromQuery)
  }
  const stored = getStoredLocale()
  if (stored) {
    return serializeLocaleQueryParams(stored)
  }
  return {}
}

/**
 * Read `lng` from the URL, persist it, and return the resolved locale.
 * Does not change i18n instance — callers should `changeLanguage` after init.
 */
export function applyLocaleFromQueryParams(searchParams: URLSearchParams): AppLocale | null {
  const locale = parseLocaleQueryParam(searchParams)
  if (!locale) return null
  setStoredLocale(locale)
  return locale
}

export function appendLocaleToUrl(url: string | URL, locale: AppLocale = DEFAULT_LOCALE): URL {
  const target = typeof url === 'string' ? new URL(url) : new URL(url.toString())
  target.searchParams.set(LOCALE_QUERY, locale)
  return target
}

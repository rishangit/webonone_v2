import {
  getAppI18n,
  normalizeLocale,
  setStoredLocale,
  type AppLocale,
} from '@webonone/i18n'

export type ChangeAppLocaleOptions = {
  /** Persist to Identity profile when available. */
  persistToIdentity?: (locale: AppLocale) => Promise<void>
}

/**
 * Apply UI language locally (storage + i18n) and optionally PATCH Identity.
 */
export async function changeAppLocale(
  locale: AppLocale,
  options: ChangeAppLocaleOptions = {},
): Promise<void> {
  const lng = normalizeLocale(locale)
  setStoredLocale(lng)
  await getAppI18n().changeLanguage(lng)
  if (options.persistToIdentity) {
    try {
      await options.persistToIdentity(lng)
    } catch {
      // Preference still applied locally; profile sync can retry later.
    }
  }
}

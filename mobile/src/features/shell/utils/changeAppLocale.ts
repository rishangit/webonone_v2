import { getAppI18n, normalizeLocale, type AppLocale } from '@webonone/i18n'

/**
 * Apply UI language to the shared i18next instance.
 * Persistence lives in SessionContext (secure storage + Identity PATCH).
 */
export async function changeAppLocale(locale: AppLocale): Promise<void> {
  await getAppI18n().changeLanguage(normalizeLocale(locale))
}

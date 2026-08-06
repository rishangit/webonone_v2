import {
  getAppI18n,
  normalizeLocale,
  setStoredLocale,
  type AppLocale,
} from '@webonone/i18n'

export async function changeAppLocale(locale: AppLocale): Promise<void> {
  const lng = normalizeLocale(locale)
  setStoredLocale(lng)
  await getAppI18n().changeLanguage(lng)
}

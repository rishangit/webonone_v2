export const SUPPORTED_LOCALES = ['en', 'si'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

export const LOCALE_STORAGE_KEY = 'webonone.locale'

export const LOCALE_QUERY = 'lng'

/** Display labels for language menus (bilingual; not loaded via i18n). */
export const LANGUAGE_MENU_LABELS: Record<AppLocale, string> = {
  en: 'English',
  si: 'සිංහල',
}

/** Intl BCP-47 tags for date/number formatting. */
export const INTL_LOCALE_TAGS: Record<AppLocale, string> = {
  en: 'en-US',
  si: 'si-LK',
}

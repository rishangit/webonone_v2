import { INTL_LOCALE_TAGS, normalizeLocale, type AppLocale } from '@webonone/i18n'
import { getAppI18n } from '@/i18n'

/** Resolve Intl BCP-47 tag from the active i18n language. */
export function getIntlLocaleTag(language?: string): string {
  const locale = normalizeLocale(language ?? getAppI18n().language) as AppLocale
  return INTL_LOCALE_TAGS[locale]
}

export function formatLocaleDate(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
  language?: string,
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(getIntlLocaleTag(language), options)
}

export function formatLocaleDateTime(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
  language?: string,
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(getIntlLocaleTag(language), options)
}

export function formatLocaleNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  language?: string,
): string {
  return value.toLocaleString(getIntlLocaleTag(language), options)
}

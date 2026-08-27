import {
  DISPLAY_DATE_OPTIONS,
  DISPLAY_DATETIME_OPTIONS,
  formatCalendarYmd,
  formatDisplayDate,
  formatDisplayDateTime,
  getIntlLocaleTag as getIntlLocaleTagForLanguage,
  parseCalendarYmd,
} from '@webonone/i18n'
import { getAppI18n } from '@/i18n'

export {
  DISPLAY_DATE_OPTIONS,
  DISPLAY_DATETIME_OPTIONS,
  formatCalendarYmd,
  parseCalendarYmd,
}

/** Resolve Intl BCP-47 tag from the active i18n language. */
export function getIntlLocaleTag(language?: string): string {
  return getIntlLocaleTagForLanguage(language ?? getAppI18n().language)
}

export function formatLocaleDate(
  value: string | number | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = DISPLAY_DATE_OPTIONS,
): string {
  return formatDisplayDate(value, language ?? getAppI18n().language, options)
}

export function formatLocaleDateTime(
  value: string | number | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = DISPLAY_DATETIME_OPTIONS,
): string {
  return formatDisplayDateTime(value, language ?? getAppI18n().language, options)
}

export function formatLocaleNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  language?: string,
): string {
  return value.toLocaleString(getIntlLocaleTag(language), options)
}

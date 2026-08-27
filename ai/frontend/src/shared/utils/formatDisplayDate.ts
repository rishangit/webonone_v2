import {
  DISPLAY_DATE_OPTIONS,
  DISPLAY_DATETIME_OPTIONS,
  formatCalendarYmd as formatCalendarYmdBase,
  formatDisplayDate as formatDisplayDateBase,
  formatDisplayDateTime as formatDisplayDateTimeBase,
} from '@webonone/i18n'
import { getAppI18n } from '@/i18n'

export { DISPLAY_DATE_OPTIONS, DISPLAY_DATETIME_OPTIONS }

function resolveLanguage(language?: string): string {
  return language ?? getAppI18n().language
}

export function formatDisplayDate(
  value: string | number | Date,
  language?: string,
): string {
  return formatDisplayDateBase(value, resolveLanguage(language))
}

export function formatDisplayDateTime(
  value: string | number | Date,
  language?: string,
): string {
  return formatDisplayDateTimeBase(value, resolveLanguage(language))
}

export function formatCalendarYmd(ymd: string, language?: string): string {
  return formatCalendarYmdBase(ymd, resolveLanguage(language))
}

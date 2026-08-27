import { INTL_LOCALE_TAGS, type AppLocale } from './constants'
import { normalizeLocale } from './localeStorage'

/** User-visible date-only shape: Oct 10, 2026 */
export const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

/** User-visible datetime: Oct 10, 2026, 3:45 PM */
export const DISPLAY_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DISPLAY_DATE_OPTIONS,
  hour: 'numeric',
  minute: '2-digit',
}

export function getIntlLocaleTag(language?: string): string {
  const locale = normalizeLocale(language ?? 'en') as AppLocale
  return INTL_LOCALE_TAGS[locale]
}

function parseToDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Parse `YYYY-MM-DD` as a local calendar date (not UTC midnight). */
export function parseCalendarYmd(ymd: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function formatDisplayDate(
  value: string | number | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = DISPLAY_DATE_OPTIONS,
): string {
  const date = parseToDate(value)
  if (!date) return ''
  return date.toLocaleDateString(getIntlLocaleTag(language), options)
}

export function formatDisplayDateTime(
  value: string | number | Date,
  language?: string,
  options: Intl.DateTimeFormatOptions = DISPLAY_DATETIME_OPTIONS,
): string {
  const date = parseToDate(value)
  if (!date) return ''
  return date.toLocaleString(getIntlLocaleTag(language), options)
}

/** Format a calendar `YYYY-MM-DD` string for display. */
export function formatCalendarYmd(ymd: string, language?: string): string {
  const date = parseCalendarYmd(ymd)
  if (!date) return ymd
  return formatDisplayDate(date, language)
}

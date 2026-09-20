import {
  formatCalendarYmd as formatCalendarYmdShared,
  formatDisplayDate as formatDisplayDateShared,
  formatDisplayDateTime as formatDisplayDateTimeShared,
} from '@webonone/i18n'
import { getAppI18n } from '@/i18n'

function language(): string {
  return getAppI18n().language
}

export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const formatted =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
      ? formatCalendarYmdShared(value, language())
      : formatDisplayDateShared(value, language())
  return formatted || '—'
}

export function formatCalendarYmd(ymd: string): string {
  return formatCalendarYmdShared(ymd, language()) || ymd
}

export function formatDisplayDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return formatDisplayDateTimeShared(value, language()) || '—'
}

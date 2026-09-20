import { DISPLAY_DATE_OPTIONS, getIntlLocaleTag } from '@webonone/i18n'
import type { AppLocale } from '@/shared/types'

export function formatChartDate(value: string, locale: AppLocale): string {
  const tag = getIntlLocaleTag(locale)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [y, m, d] = value.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString(tag, DISPLAY_DATE_OPTIONS)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(tag, DISPLAY_DATE_OPTIONS)
}

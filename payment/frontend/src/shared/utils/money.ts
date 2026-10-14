import { formatDisplayDate } from '@/shared/utils/formatDisplayDate'
import { formatMoney } from '@webonone/ui-kit'

export function formatLkr(amountMinor: number): string {
  return formatMoney(amountMinor, { minorUnits: true, currency: 'LKR' })
}

export function formatDate(iso: string, language?: string): string {
  const formatted = formatDisplayDate(iso, language)
  return formatted || '—'
}

export function formatPeriod(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} – ${formatDate(endIso)}`
}

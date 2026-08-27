import { formatDisplayDate } from '@/shared/utils/formatDisplayDate'

export function formatLkr(amountMinor: number): string {
  const major = amountMinor / 100
  return `Rs ${major.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(iso: string, language?: string): string {
  const formatted = formatDisplayDate(iso, language)
  return formatted || '—'
}

export function formatPeriod(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} – ${formatDate(endIso)}`
}

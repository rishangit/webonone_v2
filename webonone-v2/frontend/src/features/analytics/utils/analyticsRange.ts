import type { AnalyticsRangeKey } from '../types/analytics.types'

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function analyticsDateRange(key: AnalyticsRangeKey): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  to.setHours(0, 0, 0, 0)
  if (key === '7d') from.setDate(from.getDate() - 6)
  else if (key === '30d') from.setDate(from.getDate() - 29)
  else if (key === '90d') from.setDate(from.getDate() - 89)
  else from.setFullYear(from.getFullYear() - 1)
  return { from: toYmd(from), to: toYmd(to) }
}

import type { CatalogPriceRule } from '@/features/company-catalog/types/catalogPriceRule.types'

function minutesOfDay(time: string): number | null {
  const match = time.match(/^(\d{2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function priceRuleMatchesNow(
  rule: CatalogPriceRule,
  userId: string | null | undefined,
  now: Date,
): boolean {
  const audienceOk =
    rule.applyTo === 'everyone' ||
    (Boolean(userId) && rule.users.some((user) => user.id === userId))
  if (!audienceOk) return false
  if (rule.applyWhen === 'all_time') return true
  if (!rule.weekdays.includes(now.getDay())) return false
  if (!rule.startTime || !rule.endTime) return true
  const current = now.getHours() * 60 + now.getMinutes()
  const start = minutesOfDay(rule.startTime)
  const end = minutesOfDay(rule.endTime)
  if (start == null || end == null) return false
  return current >= start && current <= end
}

function specificity(rule: CatalogPriceRule): number {
  const specificTime = Boolean(rule.startTime && rule.endTime)
  return (
    (rule.applyTo === 'selected_users' ? 2 : 0) +
    (rule.applyWhen === 'selected_days' ? 1 : 0) +
    (specificTime ? 1 : 0)
  )
}

/** The price that applies to this viewer at this local time. More specific rules win. */
export function resolveApplicableCatalogPrice(
  rules: CatalogPriceRule[],
  userId: string | null | undefined,
  now: Date = new Date(),
): CatalogPriceRule | null {
  const matches = rules.filter((rule) => priceRuleMatchesNow(rule, userId, now))
  if (matches.length === 0) return null
  matches.sort((a, b) => {
    const score = specificity(b) - specificity(a)
    if (score !== 0) return score
    return b.createdAt.localeCompare(a.createdAt)
  })
  return matches[0] ?? null
}

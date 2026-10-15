export type PriceClock = {
  weekday: number
  minutes: number
}

export type ApplicablePriceRule = {
  entityId: string
  price: number
  applyWhen: 'all_time' | 'selected_days'
  weekdays: number[]
  startTime: string | null
  endTime: string | null
  applyTo: 'everyone' | 'selected_users'
  userIds: string[]
  createdAt: string
}

export function priceClockFromDate(now: Date = new Date()): PriceClock {
  return {
    weekday: now.getDay(),
    minutes: now.getHours() * 60 + now.getMinutes(),
  }
}

export function priceClockFromQuery(query: {
  atWeekday?: unknown
  atMinutes?: unknown
}): PriceClock {
  const weekday = Number(query.atWeekday)
  const minutes = Number(query.atMinutes)
  if (
    Number.isInteger(weekday) &&
    weekday >= 0 &&
    weekday <= 6 &&
    Number.isInteger(minutes) &&
    minutes >= 0 &&
    minutes <= 24 * 60
  ) {
    return { weekday, minutes }
  }
  return priceClockFromDate()
}

function minutesOfDay(time: string): number | null {
  const match = time.match(/^(\d{2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function ruleMatches(rule: ApplicablePriceRule, userId: string | null, clock: PriceClock): boolean {
  const audienceOk =
    rule.applyTo === 'everyone' || (userId != null && rule.userIds.includes(userId))
  if (!audienceOk) return false
  if (rule.applyWhen === 'all_time') return true
  if (!rule.weekdays.includes(clock.weekday)) return false
  if (!rule.startTime || !rule.endTime) return true
  const start = minutesOfDay(rule.startTime)
  const end = minutesOfDay(rule.endTime)
  if (start == null || end == null) return false
  return clock.minutes >= start && clock.minutes <= end
}

function specificity(rule: ApplicablePriceRule): number {
  const specificTime = Boolean(rule.startTime && rule.endTime)
  return (
    (rule.applyTo === 'selected_users' ? 2 : 0) +
    (rule.applyWhen === 'selected_days' ? 1 : 0) +
    (specificTime ? 1 : 0)
  )
}

/** Price that applies to this viewer at this local clock. More specific rules win. */
export function resolveApplicablePrice(
  rules: ApplicablePriceRule[],
  userId: string | null,
  clock: PriceClock,
): number | null {
  const matches = rules.filter((rule) => ruleMatches(rule, userId, clock))
  if (matches.length === 0) return null
  matches.sort((a, b) => {
    const score = specificity(b) - specificity(a)
    if (score !== 0) return score
    return b.createdAt.localeCompare(a.createdAt)
  })
  return matches[0]?.price ?? null
}

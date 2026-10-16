export type PriceClock = {
  weekday: number
  minutes: number
  dateYmd: string
}

export type ApplicableDiscount = {
  percent: number
  applyWhen: 'all_time' | 'selected_days' | 'date_range'
  weekdays: number[]
  startDate: string | null
  endDate: string | null
  applyTo: 'everyone' | 'selected_users'
  userIds: string[]
  /** Library variant ids for product discounts. Empty for services and spaces. */
  variantIds: string[]
  createdAt: string
}

export function localDateYmd(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function priceClockFromDate(now: Date = new Date()): PriceClock {
  return {
    weekday: now.getDay(),
    minutes: now.getHours() * 60 + now.getMinutes(),
    dateYmd: localDateYmd(now),
  }
}

export function priceClockFromQuery(query: {
  atWeekday?: unknown
  atMinutes?: unknown
  atDate?: unknown
}): PriceClock {
  const now = new Date()
  const dateYmd =
    typeof query.atDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.atDate)
      ? query.atDate
      : localDateYmd(now)
  const weekday = Number(query.atWeekday)
  const minutes = Number(query.atMinutes)
  const weekdayFromDate = new Date(`${dateYmd}T00:00:00`).getDay()
  return {
    weekday:
      Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
        ? weekday
        : Number.isInteger(weekdayFromDate)
          ? weekdayFromDate
          : now.getDay(),
    minutes:
      Number.isInteger(minutes) && minutes >= 0 && minutes <= 24 * 60
        ? minutes
        : now.getHours() * 60 + now.getMinutes(),
    dateYmd,
  }
}

function discountMatches(
  discount: ApplicableDiscount,
  userId: string | null,
  clock: PriceClock,
): boolean {
  const audienceOk =
    discount.applyTo === 'everyone' || (userId != null && discount.userIds.includes(userId))
  if (!audienceOk) return false
  if (discount.applyWhen === 'all_time') return true
  if (discount.applyWhen === 'selected_days') return discount.weekdays.includes(clock.weekday)
  if (!discount.startDate || !discount.endDate) return false
  return clock.dateYmd >= discount.startDate && clock.dateYmd <= discount.endDate
}

function specificity(discount: ApplicableDiscount): number {
  return (
    (discount.variantIds.length > 0 ? 8 : 0) +
    (discount.applyTo === 'selected_users' ? 4 : 0) +
    (discount.applyWhen === 'date_range' ? 2 : 0) +
    (discount.applyWhen === 'selected_days' ? 1 : 0)
  )
}

/** The discount that applies to this viewer on this local date. More specific rules win. */
export function resolveApplicableDiscount(
  discounts: ApplicableDiscount[],
  userId: string | null,
  clock: PriceClock,
): ApplicableDiscount | null {
  const matches = discounts.filter((discount) => discountMatches(discount, userId, clock))
  if (matches.length === 0) return null
  matches.sort((a, b) => {
    const score = specificity(b) - specificity(a)
    if (score !== 0) return score
    return b.createdAt.localeCompare(a.createdAt)
  })
  return matches[0] ?? null
}

/** Percentage off the active price, rounded to cents. */
export function applyDiscountPercent(price: number, percent: number): number {
  const cents = Math.round(price * 100)
  const discounted = Math.round((cents * (100 - percent)) / 100)
  return discounted / 100
}

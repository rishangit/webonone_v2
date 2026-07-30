/**
 * Activation-anchored monthly billing periods.
 * Uses calendar months with day-of-month clamp (e.g. Jan 31 → Feb 28/29).
 * Dates are treated as civil dates in the configured billing timezone via UTC midnight of the Y-M-D parts.
 */

export type BillingPeriod = {
  periodStart: Date
  periodEnd: Date
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate()
}

function addMonthsClamped(year: number, monthIndex0: number, day: number, months: number): {
  year: number
  monthIndex0: number
  day: number
} {
  const total = monthIndex0 + months
  const y = year + Math.floor(total / 12)
  let m = total % 12
  if (m < 0) {
    m += 12
  }
  const dim = daysInMonth(y, m)
  return { year: y, monthIndex0: m, day: Math.min(day, dim) }
}

function toUtcMidnight(year: number, monthIndex0: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex0, day, 0, 0, 0, 0))
}

/** Extract Y-M-D in Asia/Colombo (or any IANA zone) from an instant. */
export function civilDateParts(instant: Date, timeZone: string): {
  year: number
  monthIndex0: number
  day: number
} {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(instant)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return { year, monthIndex0: month - 1, day }
}

export function periodAtIndex(
  activatedAt: Date,
  index: number,
  timeZone: string,
): BillingPeriod {
  const base = civilDateParts(activatedAt, timeZone)
  const start = addMonthsClamped(base.year, base.monthIndex0, base.day, index)
  const end = addMonthsClamped(base.year, base.monthIndex0, base.day, index + 1)
  return {
    periodStart: toUtcMidnight(start.year, start.monthIndex0, start.day),
    periodEnd: toUtcMidnight(end.year, end.monthIndex0, end.day),
  }
}

/** All periods from activation through the period containing `now` (inclusive). */
export function periodsThroughNow(
  activatedAt: Date,
  now: Date,
  timeZone: string,
): BillingPeriod[] {
  const periods: BillingPeriod[] = []
  let index = 0
  // Safety cap: ~50 years of monthly invoices
  while (index < 600) {
    const period = periodAtIndex(activatedAt, index, timeZone)
    if (period.periodStart.getTime() > now.getTime()) {
      break
    }
    periods.push(period)
    if (period.periodEnd.getTime() > now.getTime()) {
      break
    }
    index += 1
  }
  return periods
}

export function formatPeriodLabel(periodStart: Date, periodEnd: Date, timeZone: string): string {
  const start = civilDateParts(periodStart, timeZone)
  const endExclusive = new Date(periodEnd.getTime() - 1)
  const end = civilDateParts(endExclusive, timeZone)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  if (start.year === end.year && start.monthIndex0 === end.monthIndex0) {
    return `Platform subscription — ${monthNames[start.monthIndex0]} ${start.year}`
  }
  return `Platform subscription — ${monthNames[start.monthIndex0]} ${start.day}, ${start.year} – ${monthNames[end.monthIndex0]} ${end.day}, ${end.year}`
}

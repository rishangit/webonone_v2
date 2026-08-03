import type { CompanyEvent, CompanyEventOccurrence, EventRecurrence } from '../types/event.types'

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

function toDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysYmd(ymd: string, days: number): string {
  const date = parseYmd(ymd)
  date.setDate(date.getDate() + days)
  return toDateOnly(date)
}

function weekdayOfYmd(ymd: string): number {
  return parseYmd(ymd).getDay()
}

function dayOfMonthOfYmd(ymd: string): number {
  return parseYmd(ymd).getDate()
}

function weeksBetween(startYmd: string, cursorYmd: string): number {
  const ms = parseYmd(cursorYmd).getTime() - parseYmd(startYmd).getTime()
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
}

function firstWeekDateInMonth(year: number, monthIndex: number, weekday: number): string {
  for (let day = 1; day <= 7; day++) {
    const date = new Date(year, monthIndex, day)
    if (date.getDay() === weekday) return toDateOnly(date)
  }
  return toDateOnly(new Date(year, monthIndex, 1))
}

function dateInMonthOrNull(year: number, monthIndex: number, dayOfMonth: number): string | null {
  const date = new Date(year, monthIndex, dayOfMonth)
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== dayOfMonth) {
    return null
  }
  return toDateOnly(date)
}

function iterateMonthStarts(
  fromYmd: string,
  toYmd: string,
): Array<{ year: number; monthIndex: number }> {
  const start = parseYmd(fromYmd)
  const end = parseYmd(toYmd)
  const months: Array<{ year: number; monthIndex: number }> = []
  let year = start.getFullYear()
  let monthIndex = start.getMonth()
  const endYear = end.getFullYear()
  const endMonth = end.getMonth()
  while (year < endYear || (year === endYear && monthIndex <= endMonth)) {
    months.push({ year, monthIndex })
    monthIndex += 1
    if (monthIndex > 11) {
      monthIndex = 0
      year += 1
    }
  }
  return months
}

function toOccurrence(event: CompanyEvent, occurrenceDate: string): CompanyEventOccurrence {
  return {
    ...event,
    occurrenceDate,
    start: `${occurrenceDate}T${event.startTime}:00`,
    end: `${occurrenceDate}T${event.endTime}:00`,
    title: event.serviceName,
  }
}

/** Expand an event series into occurrence rows (aligned with backend expandOccurrences). */
export function expandEventOccurrences(event: CompanyEvent): CompanyEventOccurrence[] {
  const seriesStart = event.startsOn
  const seriesEnd = event.recurrenceUntil ?? event.startsOn
  const recurrence: EventRecurrence = event.recurrence

  if (recurrence === 'none') {
    return seriesStart <= seriesEnd ? [toOccurrence(event, seriesStart)] : []
  }

  if (recurrence === 'monthly_first_week') {
    const weekday =
      event.weekdays.length > 0 ? event.weekdays[0]! : weekdayOfYmd(seriesStart)
    const results: CompanyEventOccurrence[] = []
    for (const { year, monthIndex } of iterateMonthStarts(seriesStart, seriesEnd)) {
      const occurrence = firstWeekDateInMonth(year, monthIndex, weekday)
      if (occurrence >= seriesStart && occurrence <= seriesEnd) {
        results.push(toOccurrence(event, occurrence))
      }
    }
    return results
  }

  if (recurrence === 'monthly_by_date') {
    const dayOfMonth = dayOfMonthOfYmd(seriesStart)
    const results: CompanyEventOccurrence[] = []
    for (const { year, monthIndex } of iterateMonthStarts(seriesStart, seriesEnd)) {
      const occurrence = dateInMonthOrNull(year, monthIndex, dayOfMonth)
      if (occurrence && occurrence >= seriesStart && occurrence <= seriesEnd) {
        results.push(toOccurrence(event, occurrence))
      }
    }
    return results
  }

  const weekdays =
    event.weekdays.length > 0 ? new Set(event.weekdays) : new Set([weekdayOfYmd(seriesStart)])
  const results: CompanyEventOccurrence[] = []
  let cursor = seriesStart
  while (cursor <= seriesEnd) {
    if (weekdays.has(weekdayOfYmd(cursor))) {
      if (recurrence === 'biweekly' && weeksBetween(seriesStart, cursor) % 2 !== 0) {
        cursor = addDaysYmd(cursor, 1)
        continue
      }
      results.push(toOccurrence(event, cursor))
    }
    cursor = addDaysYmd(cursor, 1)
  }
  return results
}

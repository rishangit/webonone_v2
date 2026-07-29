import type { CompanyEvent, CompanyEventOccurrence } from '../types/event.types'

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

/** Expand an event series into occurrence rows (aligned with backend expandOccurrences). */
export function expandEventOccurrences(event: CompanyEvent): CompanyEventOccurrence[] {
  const seriesStart = event.startsOn
  const seriesEnd = event.recurrenceUntil ?? event.startsOn
  const weekdays =
    event.weekdays.length > 0 ? new Set(event.weekdays) : new Set([weekdayOfYmd(seriesStart)])

  const results: CompanyEventOccurrence[] = []
  let cursor = seriesStart
  while (cursor <= seriesEnd) {
    if (weekdays.has(weekdayOfYmd(cursor))) {
      results.push({
        ...event,
        occurrenceDate: cursor,
        start: `${cursor}T${event.startTime}:00`,
        end: `${cursor}T${event.endTime}:00`,
        title: event.serviceName,
      })
    }
    cursor = addDaysYmd(cursor, 1)
  }
  return results
}

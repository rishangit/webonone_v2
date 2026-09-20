export type FullCalendarView = 'day' | 'week' | 'month'

export type FullCalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
  imageUrl?: string | null
  subtitle?: string
  issueDetail?: string
}

export const HOUR_HEIGHT_PX = 48
export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate())
}

export function startOfWeek(date: Date): Date {
  const start = startOfLocalDay(date)
  return addDays(start, -start.getDay())
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function shiftAnchor(anchor: Date, view: FullCalendarView, delta: number): Date {
  if (view === 'day') return addDays(anchor, delta)
  if (view === 'week') return addDays(anchor, delta * 7)
  return addMonths(anchor, delta)
}

export function formatPickerDate(date: Date, locale = 'en'): string {
  return date.toLocaleDateString(locale, DISPLAY_DATE_OPTIONS)
}

export function formatPeriodLabel(anchor: Date, view: FullCalendarView, locale = 'en'): string {
  if (view === 'day') {
    return formatPickerDate(anchor, locale)
  }
  if (view === 'week') {
    const start = startOfWeek(anchor)
    const end = addDays(start, 6)
    const startLabel = start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    const endLabel = formatPickerDate(end, locale)
    return `${startLabel} – ${endLabel}`
  }
  return anchor.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
}

export function eventOverlapsRange(
  event: FullCalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return event.start < rangeEnd && event.end > rangeStart
}

export function eventsForDay(events: FullCalendarEvent[], day: Date): FullCalendarEvent[] {
  const start = startOfLocalDay(day)
  const end = addDays(start, 1)
  return events
    .filter((event) => eventOverlapsRange(event, start, end))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function hourSlotRange(day: Date, hour: number): { start: Date; end: Date } {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0)
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1, 0, 0, 0)
  return { start, end }
}

export function eventLayoutInDay(
  event: FullCalendarEvent,
  day: Date,
): { top: number; height: number } {
  const dayStart = startOfLocalDay(day)
  const dayEnd = addDays(dayStart, 1)
  const clipStart = event.start < dayStart ? dayStart : event.start
  const clipEnd = event.end > dayEnd ? dayEnd : event.end
  const startMinutes = (clipStart.getTime() - dayStart.getTime()) / (60 * 1000)
  const endMinutes = (clipEnd.getTime() - dayStart.getTime()) / (60 * 1000)
  const top = (startMinutes / 60) * HOUR_HEIGHT_PX
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT_PX, 16)
  return { top, height }
}

export function monthGridDays(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor)
  const gridStart = startOfWeek(monthStart)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i))
  }
  const month = anchor.getMonth()
  const lastInMonth = days.reduce((last, d, i) => (d.getMonth() === month ? i : last), 0)
  const weeks = Math.ceil((lastInMonth + 1) / 7)
  return days.slice(0, weeks * 7)
}

export function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYmd(ymd: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined
  }
  return date
}

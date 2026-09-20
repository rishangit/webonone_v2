export const CALENDAR_SCHEDULE_PATH = '/calendar/schedule'
export const CALENDAR_EVENTS_PATH = '/calendar/events'

export function eventDetailPath(eventId: string): string {
  return `/calendar/events/${eventId}`
}

export function sessionDetailPath(eventId: string, occurrenceDate: string): string {
  return `/calendar/events/${eventId}/sessions/${occurrenceDate}`
}

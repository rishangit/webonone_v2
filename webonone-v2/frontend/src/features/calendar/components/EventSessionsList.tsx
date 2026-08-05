import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/ui-kit'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import type { CompanyEvent } from '@/features/calendar/types/event.types'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import { formatSessionTimingLabel } from '@/features/calendar/utils/formatSessionTimingLabel'

type EventSessionsListProps = {
  event: CompanyEvent
  /** When true, only list window sessions where the user has a token. */
  personalOnly?: boolean
}

function formatOccurrenceDate(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function weekdayLabel(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return DAY_LABELS[date.getDay()] ?? `D${date.getDay()}`
}

export function EventSessionsList({ event, personalOnly = false }: EventSessionsListProps) {
  const navigate = useNavigate()
  const allSessions = expandEventOccurrences(event)
  const tokenDates = event.tokenOccurrenceDates
  const sessions =
    personalOnly && event.timeMode === 'window'
      ? allSessions.filter((session) =>
          (tokenDates ?? []).includes(session.occurrenceDate),
        )
      : allSessions
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  if (sessions.length === 0) {
    return (
      <ItemListEmpty>
        {personalOnly && event.timeMode === 'window'
          ? 'No sessions with a token for your account.'
          : 'No sessions in this event\u2019s date range.'}
      </ItemListEmpty>
    )
  }

  function openSession(occurrenceDate: string) {
    navigate(`/calendar/events/${event.id}/sessions/${occurrenceDate}`)
  }

  return (
    <ItemList>
      {sessions.map((session) => {
        const timing = formatSessionTimingLabel(session.start, session.end, now)
        const timingClassName =
          timing.kind === 'current'
            ? 'shrink-0 text-right text-xs font-medium text-primary'
            : 'shrink-0 text-right text-xs text-muted-foreground'

        return (
          <ItemListItem key={session.occurrenceDate}>
            <ItemListContent>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openSession(session.occurrenceDate)}
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-foreground">
                    {formatOccurrenceDate(session.occurrenceDate)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {weekdayLabel(session.occurrenceDate)} · {session.startTime}–
                    {session.endTime}
                  </p>
                </div>
                <span className={timingClassName}>{timing.label}</span>
              </button>
            </ItemListContent>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}

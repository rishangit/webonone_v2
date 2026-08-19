import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  RemainingTime,
} from '@webonone/ui-kit'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import type { CompanyEvent } from '@/features/calendar/types/event.types'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import { formatLocaleDate } from '@/shared/utils/formatLocaleDate'

type EventSessionsListProps = {
  event: CompanyEvent
  /** When true, only list window sessions where the user has a token. */
  personalOnly?: boolean
}

function weekdayLabel(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return DAY_LABELS[date.getDay()] ?? `D${date.getDay()}`
}

export function EventSessionsList({ event, personalOnly = false }: EventSessionsListProps) {
  const { t, i18n } = useTranslation('calendar')
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
          ? t('noSessionsWithToken')
          : t('noSessionsInRange')}
      </ItemListEmpty>
    )
  }

  function openSession(occurrenceDate: string) {
    navigate(`/calendar/events/${event.id}/sessions/${occurrenceDate}`)
  }

  return (
    <ItemList>
      {sessions.map((session) => (
          <ItemListItem key={session.occurrenceDate}>
            <ItemListContent>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openSession(session.occurrenceDate)}
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-foreground">
                    {formatLocaleDate(
                      `${session.occurrenceDate}T12:00:00`,
                      { year: 'numeric', month: 'short', day: 'numeric' },
                      i18n.language,
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {weekdayLabel(session.occurrenceDate)} · {session.startTime}–
                    {session.endTime}
                  </p>
                </div>
                <RemainingTime
                  start={session.start}
                  end={session.end}
                  now={now}
                  labels={{ ended: t('timing.ended') }}
                />
              </button>
            </ItemListContent>
          </ItemListItem>
        ))}
    </ItemList>
  )
}

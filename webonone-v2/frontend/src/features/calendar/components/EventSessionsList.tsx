import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  RemainingTime,
  resolveRemainingTime,
  StatusTag,
  type StatusTagVariant,
} from '@webonone/ui-kit'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type {
  CompanyEvent,
  CompanyEventOccurrence,
  SessionRunStatus,
  SessionScheduleChangeKind,
} from '@/features/calendar/types/event.types'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { formatLocaleDate } from '@/shared/utils/formatLocaleDate'

type EventSessionsListProps = {
  event: CompanyEvent
  /** When true, only list window sessions where the user has a token. */
  personalOnly?: boolean
}

const RUN_STATUS_VARIANT: Record<SessionRunStatus, StatusTagVariant> = {
  scheduled: 'pending',
  started: 'verified',
  ended: 'member',
}

function weekdayLabel(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return DAY_LABELS[date.getDay()] ?? `D${date.getDay()}`
}

function SessionRow({
  session,
  now,
  statusLabel,
  language,
  onOpen,
  showRemainingTime,
}: {
  session: CompanyEventOccurrence
  now: Date
  statusLabel: string
  language: string
  onOpen: (occurrenceDate: string) => void
  /** Hide countdown when the session is past — StatusTag already covers ended state. */
  showRemainingTime: boolean
}) {
  const runStatus = session.runStatus ?? 'scheduled'

  return (
    <ItemListItem>
      <ItemListContent>
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onOpen(session.occurrenceDate)}
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium text-foreground">
              {formatLocaleDate(
                `${session.occurrenceDate}T12:00:00`,
                { year: 'numeric', month: 'short', day: 'numeric' },
                language,
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {weekdayLabel(session.occurrenceDate)} · {session.startTime}–{session.endTime}
            </p>
            <SessionScheduleChangeMeta
              scheduleChanged={session.scheduleChanged}
              scheduleChangeKind={session.scheduleChangeKind}
              originalStartTime={session.originalStartTime}
              originalEndTime={session.originalEndTime}
            />
          </div>
        </button>
      </ItemListContent>
      <StatusTag variant={RUN_STATUS_VARIANT[runStatus]} className="shrink-0 self-center">
        {statusLabel}
      </StatusTag>
      {showRemainingTime ? (
        <RemainingTime
          start={session.start}
          end={session.end}
          now={now}
          appearance="plain"
        />
      ) : null}
    </ItemListItem>
  )
}

export function EventSessionsList({ event, personalOnly = false }: EventSessionsListProps) {
  const { t, i18n } = useTranslation('calendar')
  const navigate = useNavigate()
  const baseSessions = useMemo(() => {
    const allSessions = expandEventOccurrences(event)
    if (personalOnly && event.timeMode === 'window') {
      const tokenDates = event.tokenOccurrenceDates ?? []
      return allSessions.filter((session) => tokenDates.includes(session.occurrenceDate))
    }
    return allSessions
  }, [event, personalOnly])

  const [occurrenceByDate, setOccurrenceByDate] = useState<
    Map<
      string,
      Pick<
        CompanyEventOccurrence,
        | 'runStatus'
        | 'startTime'
        | 'endTime'
        | 'start'
        | 'end'
        | 'scheduleChanged'
        | 'scheduleChangeKind'
        | 'originalStartTime'
        | 'originalEndTime'
      >
    >
  >(() => new Map())
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const from = event.startsOn
    const to = event.recurrenceUntil ?? event.startsOn
    let cancelled = false
    void eventsApi
      .listOccurrences(from, to)
      .then((occurrences) => {
        if (cancelled) return
        setOccurrenceByDate(
          new Map(
            occurrences
              .filter((item) => item.id === event.id)
              .map((item) => [
                item.occurrenceDate,
                {
                  runStatus: item.runStatus ?? 'scheduled',
                  startTime: item.startTime,
                  endTime: item.endTime,
                  start: item.start,
                  end: item.end,
                  scheduleChanged: item.scheduleChanged ?? false,
                  scheduleChangeKind: (item.scheduleChangeKind ?? null) as
                    | SessionScheduleChangeKind
                    | null,
                  originalStartTime: item.originalStartTime ?? item.startTime,
                  originalEndTime: item.originalEndTime ?? item.endTime,
                },
              ]),
          ),
        )
      })
      .catch(() => {
        if (!cancelled) setOccurrenceByDate(new Map())
      })
    return () => {
      cancelled = true
    }
  }, [event.id, event.startsOn, event.recurrenceUntil])

  const sessions = useMemo(
    () =>
      baseSessions.map((session) => {
        const override = occurrenceByDate.get(session.occurrenceDate)
        if (!override) return session
        return {
          ...session,
          ...override,
        }
      }),
    [baseSessions, occurrenceByDate],
  )

  const endedLabel = t('timing.ended')
  const emptyLabel =
    personalOnly && event.timeMode === 'window'
      ? t('sessionsList.emptyMember')
      : t('sessionsList.emptyAdmin')

  const upcoming: CompanyEventOccurrence[] = []
  const past: CompanyEventOccurrence[] = []
  for (const session of sessions) {
    const timing = resolveRemainingTime(session.start, session.end, now, {
      ended: endedLabel,
    })
    if (timing.kind === 'ended') {
      past.push(session)
    } else {
      upcoming.push(session)
    }
  }

  upcoming.sort((a, b) => a.start.localeCompare(b.start))
  past.sort((a, b) => b.start.localeCompare(a.start))

  function openSession(occurrenceDate: string) {
    navigate(`/calendar/events/${event.id}/sessions/${occurrenceDate}`)
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('sessionsList.upcomingTitle')}</CardTitle>
            <CardDescription>{t('sessionsList.upcomingDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <ItemListEmpty>{emptyLabel}</ItemListEmpty>
            ) : (
              <ItemList>
                {upcoming.map((session) => (
                  <SessionRow
                    key={session.occurrenceDate}
                    session={session}
                    now={now}
                    statusLabel={t(`sessionStatus.${session.runStatus ?? 'scheduled'}`)}
                    language={i18n.language}
                    onOpen={openSession}
                    showRemainingTime
                  />
                ))}
              </ItemList>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('sessionsList.pastTitle')}</CardTitle>
            <CardDescription>{t('sessionsList.pastDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {past.length === 0 ? (
              <ItemListEmpty>{t('sessionsList.emptyPast')}</ItemListEmpty>
            ) : (
              <ItemList>
                {past.map((session) => (
                  <SessionRow
                    key={session.occurrenceDate}
                    session={session}
                    now={now}
                    statusLabel={t(`sessionStatus.${session.runStatus ?? 'scheduled'}`)}
                    language={i18n.language}
                    onOpen={openSession}
                    showRemainingTime={false}
                  />
                ))}
              </ItemList>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

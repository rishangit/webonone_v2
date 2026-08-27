import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Button,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  RemainingTime,
  resolveRemainingTime,
  StatusTag,
  type StatusTagVariant,
} from '@webonone/ui-kit'
import { ExpandEventUntilDialog } from '@/features/calendar/components/ExpandEventUntilDialog'
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
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'

export type SessionListTab = 'upcoming' | 'past'

type EventSessionsListProps = {
  event: CompanyEvent
  listTab: SessionListTab
  /** When true, only list window sessions where the user has a token. */
  personalOnly?: boolean
  /** Company admins can extend Specific time series Until from Upcoming. */
  canExpand?: boolean
  onExpanded?: () => void
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
  dueLabel,
}: {
  session: CompanyEventOccurrence
  now: Date
  statusLabel: string
  language: string
  onOpen: (occurrenceDate: string) => void
  /** Hide countdown when the session is past — StatusTag already covers ended state. */
  showRemainingTime: boolean
  dueLabel: string
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
              {formatCalendarYmd(session.occurrenceDate, language)}
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
            {session.sessionIssue === 'staff_leave' ? (
              <p className="text-xs text-destructive">Staff on leave</p>
            ) : null}
            {session.sessionIssue === 'cancelled' ? (
              <p className="text-xs text-destructive">Session cancelled</p>
            ) : null}
          </div>
        </button>
      </ItemListContent>
      <StatusTag
        variant={session.sessionIssue ? 'rejected' : RUN_STATUS_VARIANT[runStatus]}
        className="shrink-0 self-center"
      >
        {session.sessionIssue === 'staff_leave'
          ? 'Staff leave'
          : session.sessionIssue === 'cancelled'
            ? 'Cancelled'
            : statusLabel}
      </StatusTag>
      {showRemainingTime ? (
        <RemainingTime
          start={session.start}
          end={session.end}
          now={now}
          runStatus={runStatus}
          labels={{ due: dueLabel }}
          appearance="plain"
        />
      ) : null}
    </ItemListItem>
  )
}

export function EventSessionsList({
  event,
  listTab,
  personalOnly = false,
  canExpand = false,
  onExpanded,
}: EventSessionsListProps) {
  const { t, i18n } = useTranslation('calendar')
  const navigate = useNavigate()
  const [expandOpen, setExpandOpen] = useState(false)
  const showExpand =
    canExpand && !personalOnly && event.timeMode === 'window' && Boolean(event.recurrenceUntil)
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
        | 'sessionCancelled'
        | 'effectiveStaffDisplayName'
        | 'sessionIssue'
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
                  sessionCancelled: item.sessionCancelled ?? false,
                  effectiveStaffDisplayName: item.effectiveStaffDisplayName,
                  sessionIssue: item.sessionIssue ?? null,
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
  const dueLabel = t('timing.due')
  const emptyLabel =
    personalOnly && event.timeMode === 'window'
      ? t('sessionsList.emptyMember')
      : t('sessionsList.emptyAdmin')

  const upcoming: CompanyEventOccurrence[] = []
  const past: CompanyEventOccurrence[] = []
  for (const session of sessions) {
    const timing = resolveRemainingTime(
      session.start,
      session.end,
      now,
      { ended: endedLabel, due: dueLabel },
      session.runStatus ?? 'scheduled',
    )
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

  function renderRows(items: CompanyEventOccurrence[], showRemainingTime: boolean, empty: string) {
    if (items.length === 0) {
      return <ItemListEmpty>{empty}</ItemListEmpty>
    }
    return (
      <ItemList>
        {items.map((session) => (
          <SessionRow
            key={session.occurrenceDate}
            session={session}
            now={now}
            statusLabel={t(`sessionStatus.${session.runStatus ?? 'scheduled'}`)}
            language={i18n.language}
            onOpen={openSession}
            showRemainingTime={showRemainingTime}
            dueLabel={dueLabel}
          />
        ))}
      </ItemList>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{t('sessionsList.sectionTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {listTab === 'upcoming'
                ? t('sessionsList.upcomingDescription')
                : t('sessionsList.pastDescription')}
            </p>
          </div>
          {showExpand && listTab === 'upcoming' ? (
            <Button type="button" size="sm" onClick={() => setExpandOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('sessionsList.add')}
            </Button>
          ) : null}
        </div>

        {listTab === 'upcoming'
          ? renderRows(upcoming, true, emptyLabel)
          : renderRows(past, false, t('sessionsList.emptyPast'))}
      </div>
      {showExpand && event.recurrenceUntil ? (
        <ExpandEventUntilDialog
          open={expandOpen}
          eventId={event.id}
          startsOn={event.startsOn}
          currentUntil={event.recurrenceUntil}
          onOpenChange={setExpandOpen}
          onExpanded={() => onExpanded?.()}
        />
      ) : null}
    </>
  )
}

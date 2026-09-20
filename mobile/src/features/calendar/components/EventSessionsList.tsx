import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
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
} from '@webonone/mobile-ui'
import { ExpandEventUntilDialog } from '@/features/calendar/components/ExpandEventUntilDialog'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { DAY_LABELS } from '@/features/calendar/schemas/eventSchemas'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type {
  CompanyEvent,
  CompanyEventOccurrence,
  SessionRunStatus,
  SessionScheduleChangeKind,
} from '@/features/calendar/types/event.types'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import { parseYmd } from '@/features/calendar/utils/dateYmd'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'
import { Body, Muted, Subheading } from '@webonone/mobile-ui'

type EventSessionsListProps = {
  event: CompanyEvent
  listTab: 'upcoming' | 'past'
  personalOnly?: boolean
  canExpand?: boolean
  onOpen: (occurrenceDate: string) => void
  onExpanded?: () => void
}

const RUN_STATUS_VARIANT: Record<SessionRunStatus, StatusTagVariant> = {
  scheduled: 'pending',
  started: 'verified',
  ended: 'member',
}

const RUN_STATUS_LABEL: Record<SessionRunStatus, string> = {
  scheduled: 'Not started',
  started: 'Started',
  ended: 'Session ended',
}

function weekdayLabel(ymd: string): string {
  const date = parseYmd(ymd)
  return date ? DAY_LABELS[date.getDay()] : ymd
}

export function EventSessionsList({
  event,
  listTab,
  personalOnly = false,
  canExpand = false,
  onOpen,
  onExpanded,
}: EventSessionsListProps) {
  const showExpand =
    canExpand && !personalOnly && event.timeMode === 'window' && Boolean(event.recurrenceUntil)
  const [expandOpen, setExpandOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
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

  const baseSessions = useMemo(() => {
    const allSessions = expandEventOccurrences(event)
    if (personalOnly && event.timeMode === 'window') {
      const tokenDates = event.tokenOccurrenceDates ?? []
      return allSessions.filter((session) => tokenDates.includes(session.occurrenceDate))
    }
    return allSessions
  }, [event, personalOnly])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
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
        return override ? { ...session, ...override } : session
      }),
    [baseSessions, occurrenceByDate],
  )

  const upcoming: CompanyEventOccurrence[] = []
  const past: CompanyEventOccurrence[] = []
  for (const session of sessions) {
    const timing = resolveRemainingTime(
      session.start,
      session.end,
      now,
      { ended: 'Ended', due: 'Due' },
      session.runStatus ?? 'scheduled',
    )
    if (timing.kind === 'ended') past.push(session)
    else upcoming.push(session)
  }
  upcoming.sort((a, b) => a.start.localeCompare(b.start))
  past.sort((a, b) => b.start.localeCompare(a.start))

  const rows = listTab === 'upcoming' ? upcoming : past
  const empty =
    listTab === 'past'
      ? 'No past sessions yet.'
      : personalOnly && event.timeMode === 'window'
        ? 'No sessions with a token for your account.'
        : 'No sessions in this event\'s date range.'

  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Subheading>Sessions</Subheading>
          <Muted>
            {listTab === 'upcoming'
              ? 'Sessions that are current or still to come'
              : 'Sessions that have already ended'}
          </Muted>
        </View>
        {showExpand && listTab === 'upcoming' ? (
          <Button size="sm" onPress={() => setExpandOpen(true)}>
            Add
          </Button>
        ) : null}
      </View>

      {rows.length === 0 ? (
        <ItemListEmpty>{empty}</ItemListEmpty>
      ) : (
        <ItemList>
          {rows.map((session) => {
            const runStatus = session.runStatus ?? 'scheduled'
            return (
              <ItemListItem key={session.occurrenceDate}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onOpen(session.occurrenceDate)}
                  className="min-w-0 flex-1"
                >
                  <ItemListContent
                    title={formatCalendarYmd(session.occurrenceDate)}
                    subtitle={`${weekdayLabel(session.occurrenceDate)} · ${session.startTime}–${session.endTime}`}
                  />
                  <SessionScheduleChangeMeta
                    scheduleChanged={session.scheduleChanged}
                    scheduleChangeKind={session.scheduleChangeKind}
                    originalStartTime={session.originalStartTime}
                    originalEndTime={session.originalEndTime}
                  />
                  {session.sessionIssue === 'staff_leave' ? (
                    <Body className="text-xs text-destructive">Staff on leave</Body>
                  ) : null}
                  {session.sessionIssue === 'cancelled' ? (
                    <Body className="text-xs text-destructive">Session cancelled</Body>
                  ) : null}
                </Pressable>
                <View className="items-end gap-1">
                  <StatusTag variant={session.sessionIssue ? 'rejected' : RUN_STATUS_VARIANT[runStatus]}>
                    {session.sessionIssue === 'staff_leave'
                      ? 'Staff leave'
                      : session.sessionIssue === 'cancelled'
                        ? 'Cancelled'
                        : RUN_STATUS_LABEL[runStatus]}
                  </StatusTag>
                  {listTab === 'upcoming' ? (
                    <RemainingTime
                      start={session.start}
                      end={session.end}
                      now={now}
                      runStatus={runStatus}
                      labels={{ due: 'Due' }}
                      appearance="plain"
                    />
                  ) : null}
                </View>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}

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
    </View>
  )
}

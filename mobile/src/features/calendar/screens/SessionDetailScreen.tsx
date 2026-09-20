import { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Redirect, useRouter, type Href } from 'expo-router'
import {
  Alert,
  AlertDescription,
  Body,
  Button,
  Card,
  ConfirmDialog,
  FeatureScreen,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  Subheading,
  itemListThumbClassName,
  useToast,
  type StatusTagVariant,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { ChangeSessionDialog } from '@/features/calendar/components/ChangeSessionDialog'
import { IssueTokenDialog } from '@/features/calendar/components/IssueTokenDialog'
import { ReassignSessionStaffDialog } from '@/features/calendar/components/ReassignSessionStaffDialog'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { TokenWorkflowProgress } from '@/features/calendar/components/TokenWorkflowProgress'
import { DAY_LABELS, formatTimeModeLabel } from '@/features/calendar/schemas/eventSchemas'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import { sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'
import type {
  CompanyEvent,
  SessionCheckIn,
  SessionCheckInsResult,
  SessionDetail,
  SessionRunStatus,
  SessionToken,
  SessionTokenStatus,
} from '@/features/calendar/types/event.types'
import {
  canAccessCompanySession,
  canChangeSession,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/calendar/utils/calendarAccess'
import { eventDetailPath } from '@/features/calendar/utils/calendarPaths'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import { parseYmd } from '@/features/calendar/utils/dateYmd'
import {
  buildScheduledSessionInstant,
  resolveSessionControlEnded,
  resolveSessionControlStarted,
  timingDisplayText,
} from '@/features/calendar/utils/sessionControlTiming'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

const DATE_YMD = /^\d{4}-\d{2}-\d{2}$/

const RUN_STATUS_LABEL: Record<SessionRunStatus, string> = {
  scheduled: 'Scheduled',
  started: 'Started',
  ended: 'Ended',
}

const RUN_STATUS_VARIANT: Record<SessionRunStatus, StatusTagVariant> = {
  scheduled: 'pending',
  started: 'verified',
  ended: 'member',
}

const TOKEN_STATUS_LABEL: Record<SessionTokenStatus, string> = {
  waiting: 'Waiting',
  serving: 'Serving',
  completed: 'Completed',
}

const TOKEN_STATUS_VARIANT: Record<SessionTokenStatus, StatusTagVariant> = {
  waiting: 'pending',
  serving: 'verified',
  completed: 'member',
}

function weekdayLabel(ymd: string): string {
  const date = parseYmd(ymd)
  return date ? DAY_LABELS[date.getDay()] : ymd
}

function TokenRow({
  token,
  isCheckedIn,
}: {
  token: SessionToken
  isCheckedIn: boolean
}) {
  const tokenStatusTag =
    token.status === 'waiting' ? (
      isCheckedIn ? (
        <StatusTag variant="verified">Checked in</StatusTag>
      ) : (
        <StatusTag variant="pending">Not checked in</StatusTag>
      )
    ) : (
      <StatusTag variant={TOKEN_STATUS_VARIANT[token.status]}>
        {TOKEN_STATUS_LABEL[token.status]}
      </StatusTag>
    )

  return (
    <ItemListItem selected={token.status === 'serving'}>
      <ImagePreview
        src={token.userAvatarUrl}
        alt={token.userDisplayName}
        className={itemListThumbClassName}
      />
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <ItemListContent title={token.tokenLabel} subtitle={token.userDisplayName} />
            <Muted className="text-xs">{token.userEmail?.trim() || 'No email'}</Muted>
          </View>
          {tokenStatusTag}
        </View>
        <TokenWorkflowProgress progress={token.workflowProgress} />
      </View>
    </ItemListItem>
  )
}

export function SessionDetailScreen({
  eventId,
  occurrenceDate,
}: {
  eventId: string
  occurrenceDate: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useSession()
  const personal = isPersonalCalendarSession(user?.role, user?.companyId)
  const [detail, setDetail] = useState<CompanyEvent | null>(null)
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [checkIns, setCheckIns] = useState<SessionCheckInsResult>({
    items: [],
    canCheckIn: false,
    checkedIn: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [checkInBusy, setCheckInBusy] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [now, setNow] = useState(() => new Date())

  const backToEvent = useCallback(() => {
    router.push(eventDetailPath(eventId) as Href)
  }, [eventId, router])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [event, sessionDetail, checkInResult] = await Promise.all([
        eventsApi.get(eventId),
        sessionTokensApi.list(eventId, occurrenceDate),
        sessionTokensApi.listCheckIns(eventId, occurrenceDate).catch(
          (): SessionCheckInsResult => ({ items: [], canCheckIn: false, checkedIn: false }),
        ),
      ])
      setDetail(event)
      setSession(sessionDetail)
      setCheckIns(checkInResult)
    } catch (err) {
      setDetail(null)
      setSession(null)
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [eventId, occurrenceDate])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const occurrence = useMemo(() => {
    if (!detail) return null
    return expandEventOccurrences(detail).find((item) => item.occurrenceDate === occurrenceDate) ?? null
  }, [detail, occurrenceDate])

  const tokens = session?.items ?? []
  const run = session?.run ?? null
  const runStatus: SessionRunStatus = run?.status ?? 'scheduled'
  const sessionIssue = session?.sessionIssue ?? null
  const effectiveStaffDisplayName =
    session?.effectiveStaffDisplayName ?? detail?.staffDisplayName ?? null
  const isAssignedStaff =
    user?.role === 'member' &&
    Boolean(user.companyId) &&
    (session?.viewerIsAssignedStaff === true || detail?.viewerIsAssignedStaff === true)
  const canOperateSession =
    canAccessCompanySession(user?.role, user?.companyId) && !sessionIssue
  const canManageSession = canManageCompanyEvents(user?.role, user?.companyId)
  const canEditSessionSchedule =
    canChangeSession(user?.role, user?.companyId, isAssignedStaff) && runStatus === 'scheduled'
  const isDuration = detail?.timeMode === 'duration'
  const canIssueTokens = Boolean(canOperateSession && !isDuration && runStatus !== 'ended')
  const checkedInUserIds = useMemo(
    () => new Set(checkIns.items.map((item: SessionCheckIn) => item.userId)),
    [checkIns.items],
  )
  const overviewTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const aInQueue =
        checkedInUserIds.has(a.userId) || a.status === 'serving' || a.status === 'completed'
      const bInQueue =
        checkedInUserIds.has(b.userId) || b.status === 'serving' || b.status === 'completed'
      if (aInQueue !== bInQueue) return aInQueue ? -1 : 1
      return (a.callOrder ?? a.tokenNumber * 1000) - (b.callOrder ?? b.tokenNumber * 1000)
    })
  }, [checkedInUserIds, tokens])

  if (
    user &&
    !canAccessCompanySession(user.role, user.companyId) &&
    !personal
  ) {
    return <Redirect href="/" />
  }

  if (!DATE_YMD.test(occurrenceDate)) {
    return (
      <FeatureScreen title="Session" description="Session details" onBack={backToEvent} backLabel="Back">
        <Body className="text-destructive">Invalid session date.</Body>
      </FeatureScreen>
    )
  }

  async function runAction(
    action: 'start' | 'end',
    request: () => Promise<SessionDetail>,
    successTitle: string,
    failTitle: string,
  ) {
    setActionBusy(true)
    try {
      const next = await request()
      setSession(next)
      toast({ title: successTitle })
      if (action === 'end') setIssueOpen(false)
    } catch (err) {
      toast({
        title: failTitle,
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setActionBusy(false)
    }
  }

  async function handleCheckIn() {
    setCheckInBusy(true)
    try {
      const next = await sessionTokensApi.checkIn(eventId, occurrenceDate)
      setCheckIns(next)
      toast({ title: 'Checked in' })
      const refreshed = await sessionTokensApi.list(eventId, occurrenceDate)
      setSession(refreshed)
    } catch (err) {
      toast({
        title: 'Failed to check in',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setCheckInBusy(false)
    }
  }

  async function handleCancel() {
    setCancelBusy(true)
    try {
      const next = await sessionTokensApi.cancel(eventId, occurrenceDate)
      setSession(next)
      toast({ title: 'Session cancelled' })
      setCancelOpen(false)
    } catch (err) {
      toast({
        title: 'Failed to cancel session',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setCancelBusy(false)
    }
  }

  if (loading && !detail) {
    return (
      <FeatureScreen title="Session" onBack={backToEvent} backLabel="Back">
        <Spinner label="Loading session…" />
      </FeatureScreen>
    )
  }

  if (error && !detail) {
    return (
      <FeatureScreen title="Session" onBack={backToEvent} backLabel="Back">
        <Body className="text-destructive">{error}</Body>
      </FeatureScreen>
    )
  }

  if (!detail || !occurrence) {
    return (
      <FeatureScreen title="Session" onBack={backToEvent} backLabel="Back">
        <Body className="text-destructive">This session is not part of the event series.</Body>
      </FeatureScreen>
    )
  }

  const effectiveStartTime = session?.sessionStartTime ?? occurrence.startTime
  const effectiveEndTime = session?.sessionEndTime ?? occurrence.endTime
  const scheduleChanged = Boolean(run?.scheduledStartTime && run?.scheduledEndTime)
  const scheduleChangeKind = scheduleChanged
    ? (() => {
        const [oh, om] = detail.startTime.split(':').map(Number)
        const [nh, nm] = effectiveStartTime.split(':').map(Number)
        const delta = (nh ?? 0) * 60 + (nm ?? 0) - ((oh ?? 0) * 60 + (om ?? 0))
        if (delta > 0) return 'delayed' as const
        if (delta < 0) return 'early' as const
        return null
      })()
    : null
  const relatedMemberCount = tokens.length > 0 ? tokens.length : detail.attendeeUserId ? 1 : 0
  const titleDate = formatCalendarYmd(occurrence.occurrenceDate)
  const scheduledStartIso = buildScheduledSessionInstant(occurrence.occurrenceDate, effectiveStartTime)
  const scheduledEndIso = buildScheduledSessionInstant(occurrence.occurrenceDate, effectiveEndTime)
  const timingInput = {
    runStatus,
    now,
    scheduledStartIso,
    scheduledEndIso,
    startedAt: run?.startedAt,
    endedAt: run?.endedAt,
  }
  const showAttendee = isDuration || Boolean(detail.attendeeDisplayName || detail.attendeeUserId)

  return (
    <FeatureScreen
      title={titleDate}
      description={`${detail.serviceName} session`}
      onBack={backToEvent}
      backLabel="Back"
      actions={
        canOperateSession && runStatus === 'started' ? (
          <Button
            variant="outline"
            size="sm"
            disabled={actionBusy}
            onPress={() =>
              void runAction(
                'end',
                () => sessionTokensApi.end(eventId, occurrenceDate),
                'Session ended',
                'Failed to end session',
              )
            }
          >
            End session
          </Button>
        ) : undefined
      }
    >
      <View className="gap-6">
        {sessionIssue ? (
          <Alert variant="destructive">
            <AlertDescription>
              {sessionIssue === 'staff_leave'
                ? `Assigned staff (${effectiveStaffDisplayName ?? 'Staff'}) is on leave for this session. Cancel the session or reassign another staff member.`
                : 'This session is cancelled and is hidden from customers.'}
            </AlertDescription>
          </Alert>
        ) : null}

        {isDuration ? (
          <Card className="gap-3">
            <Subheading>Session</Subheading>
            <Muted>Duration sessions are for the assigned attendee — no queue tokens</Muted>
            <ReadOnlyField label="Attendee" value={detail.attendeeDisplayName ?? '—'} />
            <ReadOnlyField label="Email" value={detail.attendeeEmail ?? '—'} />
            <View className="gap-1">
              <Muted className="text-xs uppercase tracking-wide">Status</Muted>
              <StatusTag variant={RUN_STATUS_VARIANT[runStatus]}>
                {RUN_STATUS_LABEL[runStatus]}
              </StatusTag>
            </View>
          </Card>
        ) : (
          <Card className="gap-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1 gap-1">
                <Subheading>Tokens</Subheading>
                <Muted>
                  {runStatus === 'ended'
                    ? 'This session has ended. Tokens can no longer be issued.'
                    : 'Queue tokens issued for this session.'}
                </Muted>
              </View>
              {canIssueTokens ? (
                <Button size="sm" onPress={() => setIssueOpen(true)}>
                  Issue token
                </Button>
              ) : null}
            </View>
            {tokens.length === 0 ? (
              <ItemListEmpty>
                {personal ? 'No token for your account yet.' : 'No tokens issued yet.'}
              </ItemListEmpty>
            ) : (
              <ItemList>
                {overviewTokens.map((token) => (
                  <TokenRow
                    key={token.id}
                    token={token}
                    isCheckedIn={checkedInUserIds.has(token.userId)}
                  />
                ))}
              </ItemList>
            )}
          </Card>
        )}

        <Card className="gap-3">
          <Subheading>Controls</Subheading>
          <Muted>
            {isDuration
              ? 'Start and end this duration session.'
              : 'Start this window session, then issue and call tokens.'}
          </Muted>
          <View className="gap-1">
            <Muted className="text-xs uppercase tracking-wide">Status</Muted>
            <StatusTag variant={RUN_STATUS_VARIANT[runStatus]}>
              {RUN_STATUS_LABEL[runStatus]}
            </StatusTag>
          </View>
          <ReadOnlyField
            label="Started"
            value={timingDisplayText(resolveSessionControlStarted(timingInput))}
          />
          <ReadOnlyField
            label="Ended"
            value={timingDisplayText(resolveSessionControlEnded(timingInput))}
          />
          {canOperateSession && runStatus === 'scheduled' ? (
            <Button
              disabled={actionBusy}
              onPress={() =>
                void runAction(
                  'start',
                  () => sessionTokensApi.start(eventId, occurrenceDate),
                  'Session started',
                  'Failed to start session',
                )
              }
            >
              Start session
            </Button>
          ) : null}
          {checkIns.canCheckIn && !checkIns.checkedIn ? (
            <Button variant="outline" disabled={checkInBusy} onPress={() => void handleCheckIn()}>
              {checkInBusy ? 'Checking in…' : 'Check in'}
            </Button>
          ) : checkIns.checkedIn ? (
            <StatusTag variant="verified">Checked in</StatusTag>
          ) : null}
          {!isDuration && runStatus === 'started' ? (
            <Muted>Issue tokens and complete check-in to manage the queue.</Muted>
          ) : null}
          {isDuration && runStatus === 'started' ? (
            <Muted>This duration session is in progress.</Muted>
          ) : null}
          {isDuration && runStatus === 'ended' ? (
            <Muted>This duration session has ended.</Muted>
          ) : null}
        </Card>

        <Card className="gap-3">
          <Subheading>When</Subheading>
          <Muted>Date and time for this session</Muted>
          <ReadOnlyField label="Date" value={titleDate} />
          <ReadOnlyField label="Weekday" value={weekdayLabel(occurrence.occurrenceDate)} />
          <ReadOnlyField label="Time" value={`${effectiveStartTime}–${effectiveEndTime}`} />
          <SessionScheduleChangeMeta
            scheduleChanged={scheduleChanged}
            scheduleChangeKind={scheduleChangeKind}
            originalStartTime={detail.startTime}
            originalEndTime={detail.endTime}
          />
        </Card>

        {canChangeSession(user?.role, user?.companyId, isAssignedStaff) ? (
          <Card className="gap-3">
            <Subheading>Change session</Subheading>
            <Muted>Delay this session’s start and optionally notify attendees</Muted>
            {canEditSessionSchedule ? (
              <Button size="sm" onPress={() => setChangeOpen(true)}>
                Change session
              </Button>
            ) : (
              <Muted>Schedule can only be changed while the session is scheduled.</Muted>
            )}
          </Card>
        ) : null}

        <Card className="gap-3">
          <Subheading>Service</Subheading>
          <Muted>Catalog service for this session</Muted>
          <ReadOnlyField label="Name" value={detail.serviceName} />
          <ReadOnlyField label="Time mode" value={formatTimeModeLabel(detail.timeMode)} />
        </Card>

        <Card className="gap-3">
          <Subheading>Staff</Subheading>
          <Muted>Staff member delivering the service</Muted>
          <ReadOnlyField label="Name" value={effectiveStaffDisplayName ?? '—'} />
          {canManageSession ? (
            <View className="flex-row flex-wrap gap-2">
              {sessionIssue !== 'cancelled' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancelBusy}
                  onPress={() => setCancelOpen(true)}
                >
                  Cancel session
                </Button>
              ) : null}
              <Button size="sm" onPress={() => setReassignOpen(true)}>
                Reassign staff
              </Button>
            </View>
          ) : null}
        </Card>

        {showAttendee && !isDuration ? (
          <Card className="gap-3">
            <Subheading>Attendee</Subheading>
            <Muted>Identity user attending this session</Muted>
            <ReadOnlyField label="Name" value={detail.attendeeDisplayName ?? '—'} />
            <ReadOnlyField label="Email" value={detail.attendeeEmail ?? '—'} />
          </Card>
        ) : null}
      </View>

      {!isDuration && canIssueTokens ? (
        <IssueTokenDialog
          open={issueOpen}
          eventId={eventId}
          occurrenceDate={occurrenceDate}
          tokens={tokens}
          onOpenChange={setIssueOpen}
          onIssued={() => void load()}
        />
      ) : null}

      {canChangeSession(user?.role, user?.companyId, isAssignedStaff) ? (
        <ChangeSessionDialog
          open={changeOpen}
          eventId={eventId}
          occurrenceDate={occurrenceDate}
          currentStartTime={effectiveStartTime}
          currentEndTime={effectiveEndTime}
          relatedMemberCount={relatedMemberCount}
          onOpenChange={setChangeOpen}
          onChanged={() => void load()}
        />
      ) : null}

      {canManageSession ? (
        <ReassignSessionStaffDialog
          open={reassignOpen}
          eventId={eventId}
          occurrenceDate={occurrenceDate}
          currentStaffId={session?.effectiveStaffId ?? detail.staffId}
          onOpenChange={setReassignOpen}
          onReassigned={() => void load()}
        />
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this session?"
        description="This session will be cancelled and hidden from customers."
        confirmLabel="Cancel session"
        destructive
        busy={cancelBusy}
        onOpenChange={setCancelOpen}
        onConfirm={() => void handleCancel()}
      />
    </FeatureScreen>
  )
}

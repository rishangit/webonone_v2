import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  StatusTag,
  useToast,
  type StatusTagVariant,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { IssueTokenDialog } from '@/features/calendar/components/IssueTokenDialog'
import { formatTimeModeLabel } from '@/features/calendar/schemas/eventSchemas'
import { eventsActions, sessionTokensActions } from '@/features/calendar/store'
import type {
  CompanyEvent,
  SessionRunStatus,
  SessionTokenStatus,
} from '@/features/calendar/types/event.types'
import { canAccessCompanySession } from '@/features/session/utils/canAccessCompanySession'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
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

export function SessionDetailsPage() {
  const { eventId, occurrenceDate } = useParams<{
    eventId: string
    occurrenceDate: string
  }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const detail = useAppSelector((s) => s.events.detail) as CompanyEvent | null
  const detailStatus = useAppSelector((s) => s.events.detailStatus)
  const detailError = useAppSelector((s) => s.events.detailError)
  const tokens = useAppSelector((s) => s.sessionTokens.items)
  const run = useAppSelector((s) => s.sessionTokens.run)
  const tokensStatus = useAppSelector((s) => s.sessionTokens.listStatus)
  const tokensError = useAppSelector((s) => s.sessionTokens.listError)
  const actionStatus = useAppSelector((s) => s.sessionTokens.actionStatus)
  const actionError = useAppSelector((s) => s.sessionTokens.actionError)
  const lastAction = useAppSelector((s) => s.sessionTokens.lastAction)
  const [issueOpen, setIssueOpen] = useState(false)
  const lastActionStatus = useRef(actionStatus)

  const loading = detailStatus === 'loading' && !detail
  usePlatformLoading(loading ? 'Loading session…' : null)

  useEffect(() => {
    if (!eventId) return
    dispatch(eventsActions.fetchDetailRequested({ id: eventId, force: true }))
    return () => {
      dispatch(eventsActions.resetDetail())
    }
  }, [dispatch, eventId])

  useEffect(() => {
    if (!eventId || !occurrenceDate || !DATE_YMD.test(occurrenceDate)) return
    dispatch(
      sessionTokensActions.fetchListRequested({ eventId, occurrenceDate }),
    )
    return () => {
      dispatch(sessionTokensActions.reset())
    }
  }, [dispatch, eventId, occurrenceDate])

  useEffect(() => {
    if (lastActionStatus.current === 'saving' && actionStatus === 'idle' && !actionError) {
      if (lastAction === 'start') toast({ title: 'Session started' })
      if (lastAction === 'call-next') toast({ title: 'Next token called' })
      if (lastAction === 'call-previous') toast({ title: 'Moved to previous token' })
      if (lastAction === 'end') toast({ title: 'Session ended' })
      dispatch(sessionTokensActions.resetActionStatus())
    }
    if (actionError) {
      const title =
        lastAction === 'start'
          ? 'Failed to start session'
          : lastAction === 'call-next'
            ? 'Failed to call next token'
            : lastAction === 'call-previous'
              ? 'Failed to call previous token'
              : lastAction === 'end'
                ? 'Failed to end session'
                : 'Session action failed'
      toast({ title, description: actionError, variant: 'destructive' })
      dispatch(sessionTokensActions.resetActionStatus())
    }
    lastActionStatus.current = actionStatus
  }, [actionStatus, actionError, lastAction, toast, dispatch])

  const backToEvent = () => {
    if (eventId) navigate(`/calendar/events/${eventId}`)
    else navigate('/calendar/events')
  }

  const sessionKey =
    eventId && occurrenceDate
      ? { eventId, occurrenceDate }
      : null

  const actionBusy = actionStatus === 'saving'
  const runStatus = run?.status ?? 'scheduled'
  const currentToken =
    tokens.find((token) => token.id === run?.currentTokenId) ??
    tokens.find((token) => token.status === 'serving') ??
    null
  const prevToken =
    tokens
      .filter((token) => token.status === 'completed')
      .reduce<typeof tokens[number] | null>(
        (best, token) =>
          !best || token.tokenNumber > best.tokenNumber ? token : best,
        null,
      )
  const nextToken =
    tokens
      .filter((token) => token.status === 'waiting')
      .reduce<typeof tokens[number] | null>(
        (best, token) =>
          !best || token.tokenNumber < best.tokenNumber ? token : best,
        null,
      )
  const canCallPrevious = Boolean(prevToken)
  const canCallNext =
    Boolean(nextToken) || tokens.some((token) => token.status === 'serving')

  if (selectionComplete && !canAccessCompanySession(activeRole, activeCompanyId)) {
    return (
      <FeaturePage title="Session" description="Session details">
        <Alert variant="destructive">
          <AlertDescription>Company session required.</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (loading) {
    return null
  }

  if (!occurrenceDate || !DATE_YMD.test(occurrenceDate)) {
    return (
      <FeaturePage
        title="Session"
        description="Session details"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={backToEvent}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>Invalid session date.</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (detailError && !detail) {
    return (
      <FeaturePage
        title="Session"
        description="Session details"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={backToEvent}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!detail || !eventId) {
    return null
  }

  const session = expandEventOccurrences(detail).find(
    (item) => item.occurrenceDate === occurrenceDate,
  )

  if (!session) {
    return (
      <FeaturePage
        title="Session"
        description="Session details"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={backToEvent}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>This session is not part of the event series.</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const isDuration = detail.timeMode === 'duration'
  const showAttendee =
    isDuration || Boolean(detail.attendeeDisplayName || detail.attendeeUserId)
  const titleDate = formatOccurrenceDate(session.occurrenceDate)

  return (
    <FeaturePage
      title={titleDate}
      description={`${detail.serviceName} session`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {runStatus === 'started' && sessionKey ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionBusy}
              onClick={() => dispatch(sessionTokensActions.endRequested(sessionKey))}
            >
              End session
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={backToEvent}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isDuration ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session</CardTitle>
                <CardDescription>
                  Duration sessions are for the assigned attendee — no queue tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailField
                  label="Attendee"
                  value={detail.attendeeDisplayName ?? '—'}
                />
                <DetailField label="Email" value={detail.attendeeEmail ?? '—'} />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <StatusTag variant={RUN_STATUS_VARIANT[runStatus]}>
                    {RUN_STATUS_LABEL[runStatus]}
                  </StatusTag>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg">Tokens</CardTitle>
                  <CardDescription>
                    Queue tokens issued for users at this session
                  </CardDescription>
                </div>
                <Button type="button" size="sm" onClick={() => setIssueOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Issue new token
                </Button>
              </CardHeader>
              <CardContent>
                {tokensError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{tokensError}</AlertDescription>
                  </Alert>
                ) : tokensStatus === 'loading' && tokens.length === 0 ? null : tokens.length === 0 ? (
                  <ItemListEmpty>No tokens issued yet.</ItemListEmpty>
                ) : (
                  <ItemList>
                    {tokens.map((token) => (
                      <ItemListItem
                        key={token.id}
                        className={
                          token.status === 'serving'
                            ? 'ring-1 ring-primary/40'
                            : undefined
                        }
                      >
                        <ItemListContent>
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <p className="truncate font-medium text-foreground">
                                {token.tokenLabel}
                              </p>
                              <p className="truncate text-sm text-foreground">
                                {token.userDisplayName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {token.userEmail ?? 'No email'}
                              </p>
                            </div>
                            <StatusTag variant={TOKEN_STATUS_VARIANT[token.status]}>
                              {TOKEN_STATUS_LABEL[token.status]}
                            </StatusTag>
                          </div>
                        </ItemListContent>
                      </ItemListItem>
                    ))}
                  </ItemList>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isDuration ? 'Session controls' : 'Session queue'}
              </CardTitle>
              <CardDescription>
                {isDuration
                  ? 'Start or end this appointment session'
                  : 'Start the session and move through tokens'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {runStatus === 'scheduled' && sessionKey ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={actionBusy}
                  onClick={() => dispatch(sessionTokensActions.startRequested(sessionKey))}
                >
                  Start session
                </Button>
              ) : null}

              {!isDuration && runStatus !== 'scheduled' ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 px-2 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Prev
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {prevToken?.tokenLabel ?? '—'}
                      </p>
                    </div>
                    <div className="space-y-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Current
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {currentToken?.tokenLabel ?? '—'}
                      </p>
                    </div>
                    <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 px-2 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Next
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {nextToken?.tokenLabel ?? '—'}
                      </p>
                    </div>
                  </div>

                  {runStatus === 'started' && sessionKey ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={actionBusy || !canCallPrevious}
                        onClick={() =>
                          dispatch(sessionTokensActions.callPreviousRequested(sessionKey))
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1"
                        disabled={actionBusy || !canCallNext}
                        onClick={() =>
                          dispatch(sessionTokensActions.callNextRequested(sessionKey))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : null}

              {isDuration && runStatus === 'started' ? (
                <p className="text-sm text-muted-foreground">
                  Session is in progress for the assigned attendee.
                </p>
              ) : null}

              {isDuration && runStatus === 'ended' ? (
                <p className="text-sm text-muted-foreground">This session has ended.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When</CardTitle>
              <CardDescription>Date and time for this session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Date" value={titleDate} />
              <DetailField label="Weekday" value={weekdayLabel(session.occurrenceDate)} />
              <DetailField
                label="Time"
                value={`${session.startTime}–${session.endTime}`}
              />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <StatusTag variant={RUN_STATUS_VARIANT[runStatus]}>
                  {RUN_STATUS_LABEL[runStatus]}
                </StatusTag>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service</CardTitle>
              <CardDescription>Catalog service for this session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Name" value={detail.serviceName} />
              <DetailField label="Time mode" value={formatTimeModeLabel(detail.timeMode)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff</CardTitle>
              <CardDescription>Staff member delivering the service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Name" value={detail.staffDisplayName} />
            </CardContent>
          </Card>

          {showAttendee && !isDuration ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendee</CardTitle>
                <CardDescription>Identity user attending this session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailField label="Name" value={detail.attendeeDisplayName ?? '—'} />
                <DetailField label="Email" value={detail.attendeeEmail ?? '—'} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {!isDuration ? (
        <IssueTokenDialog
          open={issueOpen}
          eventId={eventId}
          occurrenceDate={occurrenceDate}
          onOpenChange={setIssueOpen}
        />
      ) : null}
    </FeaturePage>
  )
}

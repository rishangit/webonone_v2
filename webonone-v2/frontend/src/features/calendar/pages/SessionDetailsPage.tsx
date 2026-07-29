import { useEffect, useState } from 'react'
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
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { IssueTokenDialog } from '@/features/calendar/components/IssueTokenDialog'
import { formatTimeModeLabel } from '@/features/calendar/schemas/eventSchemas'
import { eventsActions, sessionTokensActions } from '@/features/calendar/store'
import type { CompanyEvent } from '@/features/calendar/types/event.types'
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

export function SessionDetailsPage() {
  const { eventId, occurrenceDate } = useParams<{
    eventId: string
    occurrenceDate: string
  }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const detail = useAppSelector((s) => s.events.detail) as CompanyEvent | null
  const detailStatus = useAppSelector((s) => s.events.detailStatus)
  const detailError = useAppSelector((s) => s.events.detailError)
  const tokens = useAppSelector((s) => s.sessionTokens.items)
  const tokensStatus = useAppSelector((s) => s.sessionTokens.listStatus)
  const tokensError = useAppSelector((s) => s.sessionTokens.listError)
  const [issueOpen, setIssueOpen] = useState(false)

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

  const backToEvent = () => {
    if (eventId) navigate(`/calendar/events/${eventId}`)
    else navigate('/calendar/events')
  }

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
        <Button type="button" variant="outline" size="sm" onClick={backToEvent}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
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
                    <ItemListItem key={token.id}>
                      <ItemListContent>
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
                      </ItemListContent>
                    </ItemListItem>
                  ))}
                </ItemList>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
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

          {showAttendee ? (
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

      <IssueTokenDialog
        open={issueOpen}
        eventId={eventId}
        occurrenceDate={occurrenceDate}
        onOpenChange={setIssueOpen}
      />
    </FeaturePage>
  )
}

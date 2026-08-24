import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PLATFORM_MESSAGE_TYPES } from '@webonone/platform-embed'
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
import { ChangeSessionDialog } from '@/features/calendar/components/ChangeSessionDialog'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { formatTimeModeLabel } from '@/features/calendar/schemas/eventSchemas'
import { eventsActions, sessionCheckInsActions, sessionTokensActions } from '@/features/calendar/store'
import { DurationSessionWorkflowCard } from '@/features/calendar/components/DurationSessionWorkflowCard'
import { SessionDetailSectionTabs } from '@/features/calendar/components/SessionDetailSectionTabs'
import { SessionWorkflowStepPanel } from '@/features/calendar/components/SessionWorkflowStepPanel'
import { TokenWorkflowProgress } from '@/features/calendar/components/TokenWorkflowProgress'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'
import type {
  CompanyEvent,
  SessionRunStatus,
  SessionTokenStatus,
} from '@/features/calendar/types/event.types'
import {
  buildDesignFillPeerDialogPath,
  DESIGN_FORM_FILL_DIALOG_SIZE,
  getDesignOrigin,
} from '@/features/design/utils/designConfig'
import { designFormsApi } from '@/features/design/services/designFormsApi'
import {
  canAccessCompanySession,
  canChangeSession,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/session/utils/canAccessCompanySession'
import { ReassignSessionStaffDialog } from '@/features/calendar/components/ReassignSessionStaffDialog'
import { sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import { tokensAtWorkflowStep } from '@/features/calendar/utils/workflowStepQueue'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { usePlatformPeerDialog } from '@/features/shell/PlatformPeerDialogContext'
import { staffApi } from '@/features/staff/services/staffApi'
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

function tokenFormSubmissionKey(tokenId: string, formId: string): string {
  return `${tokenId}:${formId}`
}

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
  const { openPeerDialog } = usePlatformPeerDialog()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const authUser = useAppSelector((s) => s.auth.user)
  const detail = useAppSelector((s) => s.events.detail) as CompanyEvent | null
  const detailStatus = useAppSelector((s) => s.events.detailStatus)
  const detailError = useAppSelector((s) => s.events.detailError)
  const tokens = useAppSelector((s) => s.sessionTokens.items)
  const run = useAppSelector((s) => s.sessionTokens.run)
  const sessionStartTime = useAppSelector((s) => s.sessionTokens.sessionStartTime)
  const sessionEndTime = useAppSelector((s) => s.sessionTokens.sessionEndTime)
  const sessionIssue = useAppSelector((s) => s.sessionTokens.sessionIssue)
  const effectiveStaffDisplayName = useAppSelector(
    (s) => s.sessionTokens.effectiveStaffDisplayName,
  )
  const tokensStatus = useAppSelector((s) => s.sessionTokens.listStatus)
  const tokensError = useAppSelector((s) => s.sessionTokens.listError)
  const actionStatus = useAppSelector((s) => s.sessionTokens.actionStatus)
  const actionError = useAppSelector((s) => s.sessionTokens.actionError)
  const lastAction = useAppSelector((s) => s.sessionTokens.lastAction)
  const checkIns = useAppSelector((s) => s.sessionCheckIns.items)
  const checkInActionStatus = useAppSelector((s) => s.sessionCheckIns.actionStatus)
  const [issueOpen, setIssueOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [isAssignedStaff, setIsAssignedStaff] = useState(false)
  const [submissionByTokenForm, setSubmissionByTokenForm] = useState<Record<string, string>>({})
  const [attendeeSubmissionId, setAttendeeSubmissionId] = useState<string | null>(null)
  const lastActionStatus = useRef(actionStatus)
  const isPersonal = isPersonalCalendarSession(activeRole, activeCompanyId)
  const { t } = useTranslation('calendar')
  const [sessionTab, setSessionTab] = useState('overview')
  const [workflowItems, setWorkflowItems] = useState<ServiceWorkflowItem[]>([])
  const [completingTokenId, setCompletingTokenId] = useState<string | null>(null)

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
    dispatch(
      sessionCheckInsActions.fetchListRequested({ eventId, occurrenceDate }),
    )
    return () => {
      dispatch(sessionTokensActions.reset())
      dispatch(sessionCheckInsActions.reset())
    }
  }, [dispatch, eventId, occurrenceDate])

  const lastCheckInActionStatus = useRef(checkInActionStatus)
  useEffect(() => {
    if (
      lastCheckInActionStatus.current === 'saving' &&
      checkInActionStatus !== 'saving' &&
      eventId &&
      occurrenceDate &&
      DATE_YMD.test(occurrenceDate)
    ) {
      dispatch(
        sessionTokensActions.fetchListRequested({ eventId, occurrenceDate }),
      )
    }
    lastCheckInActionStatus.current = checkInActionStatus
  }, [checkInActionStatus, dispatch, eventId, occurrenceDate])

  useEffect(() => {
    if (detail?.timeMode === 'duration') setSessionTab('overview')
  }, [detail?.timeMode])

  useEffect(() => {
    if (!detail?.serviceId) {
      setWorkflowItems([])
      return
    }
    let cancelled = false
    const companyId = detail.companyId
    const workflowRequest = companyId
      ? companyCatalogApi.listServiceWorkflowForCompany(companyId, detail.serviceId)
      : companyCatalogApi.listServiceWorkflow(detail.serviceId)
    const spacesRequest = companyId
      ? companyCatalogApi.listForCompany(companyId, 'spaces')
      : companyCatalogApi.list('spaces')
    void Promise.all([workflowRequest, spacesRequest])
      .then(async ([workflow, spacesResult]) => {
        const spaces = await hydrateLinkedCatalogItems('spaces', spacesResult.items)
        if (cancelled) return
        const spaceNameById = new Map(spaces.map((space) => [space.id, space.displayName]))
        const formsResult = await designFormsApi.listPublished().catch(() => ({ items: [] }))
        if (cancelled) return
        const formNameById = new Map(formsResult.items.map((form) => [form.id, form.name]))
        setWorkflowItems(
          workflow.items.map((item) => ({
            ...item,
            space: item.space
              ? {
                  id: item.space.id,
                  name: spaceNameById.get(item.space.id) ?? item.space.name,
                }
              : null,
            forms: (item.forms ?? []).map((form) => ({
              id: form.id,
              name: formNameById.get(form.id) ?? form.name ?? form.id,
            })),
            sessionQueue: Boolean(item.sessionQueue),
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setWorkflowItems([])
      })
    return () => {
      cancelled = true
    }
  }, [detail?.companyId, detail?.serviceId, isPersonal])

  useEffect(() => {
    if (!isPersonal || !eventId || !occurrenceDate || !DATE_YMD.test(occurrenceDate)) return
    if (detail && detail.timeMode !== 'window') return

    const tick = () => {
      if (document.visibilityState !== 'visible') return
      dispatch(
        sessionTokensActions.fetchListRequested({
          eventId,
          occurrenceDate,
          silent: true,
        }),
      )
    }
    const id = window.setInterval(tick, 3000)
    return () => {
      window.clearInterval(id)
    }
  }, [dispatch, eventId, occurrenceDate, isPersonal, detail?.timeMode])

  useEffect(() => {
    if (!eventId || !occurrenceDate || !DATE_YMD.test(occurrenceDate)) return
    let cancelled = false
    designFormsApi
      .listSubmissionsForSession(eventId, occurrenceDate)
      .then((result) => {
        if (cancelled) return
        const byTokenForm: Record<string, string> = {}
        let attendeeId: string | null = null
        for (const item of result.items ?? []) {
          if (item.sessionTokenId && item.formTemplateId) {
            byTokenForm[tokenFormSubmissionKey(item.sessionTokenId, item.formTemplateId)] =
              item.id
          } else if (
            detail?.attendeeUserId &&
            item.subjectUserId === detail.attendeeUserId
          ) {
            attendeeId = item.id
          }
        }
        setSubmissionByTokenForm(byTokenForm)
        setAttendeeSubmissionId(attendeeId)
      })
      .catch(() => {
        if (!cancelled) {
          setSubmissionByTokenForm({})
          setAttendeeSubmissionId(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [detail?.attendeeUserId, eventId, occurrenceDate])

  useEffect(() => {
    if (!detail?.staffId || !authUser?.id || activeRole !== 'member' || !activeCompanyId) {
      setIsAssignedStaff(false)
      return
    }
    let cancelled = false
    staffApi
      .get(detail.staffId)
      .then((staff) => {
        if (!cancelled) setIsAssignedStaff(staff.userId === authUser.id)
      })
      .catch(() => {
        if (!cancelled) setIsAssignedStaff(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeCompanyId, activeRole, authUser?.id, detail?.staffId])

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
  const checkedInUserIds = useMemo(
    () => new Set(checkIns.map((item) => item.userId)),
    [checkIns],
  )
  const overviewTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const aInQueue =
        checkedInUserIds.has(a.userId) || a.status === 'serving' || a.status === 'completed'
      const bInQueue =
        checkedInUserIds.has(b.userId) || b.status === 'serving' || b.status === 'completed'
      if (aInQueue !== bInQueue) return aInQueue ? -1 : 1
      return a.tokenNumber - b.tokenNumber
    })
  }, [checkedInUserIds, tokens])
  if (
    selectionComplete &&
    !canAccessCompanySession(activeRole, activeCompanyId) &&
    !isPersonal
  ) {
    return (
      <FeaturePage
        title="Session"
        description="Session details"
        onBack={backToEvent}
        backLabel="Back"
      >
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
        onBack={backToEvent}
        backLabel="Back"
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
        onBack={backToEvent}
        backLabel="Back"
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
        onBack={backToEvent}
        backLabel="Back"
      >
        <Alert variant="destructive">
          <AlertDescription>This session is not part of the event series.</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const isDuration = detail.timeMode === 'duration'
  const durationAttendeeToken =
    tokens.find((token) => token.userId === detail.attendeeUserId) ?? tokens[0] ?? null
  const showAttendee =
    isDuration || Boolean(detail.attendeeDisplayName || detail.attendeeUserId)
  const canOperateSession = canAccessCompanySession(activeRole, activeCompanyId) && !sessionIssue
  const canManageSession = canManageCompanyEvents(activeRole, activeCompanyId)
  const canEditSessionSchedule =
    canChangeSession(activeRole, activeCompanyId, isAssignedStaff) && runStatus === 'scheduled'
  const effectiveStartTime = sessionStartTime ?? session.startTime
  const effectiveEndTime = sessionEndTime ?? session.endTime
  const scheduleChanged = Boolean(
    run?.scheduledStartTime && run?.scheduledEndTime,
  )
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
  const relatedMemberCount =
    tokens.length > 0
      ? tokens.length
      : detail.attendeeUserId
        ? 1
        : 0
  const titleDate = formatOccurrenceDate(session.occurrenceDate)
  const formTemplateId = detail.formTemplateId
  const serviceId = detail.serviceId
  const serviceName = detail.serviceName

  function openFillForm(subject: {
    userId: string
    displayName: string
    email?: string | null
    sessionTokenId?: string | null
    formId: string
  }) {
    if (!eventId || !occurrenceDate) return
    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `form-fill-${Date.now()}`
    const path = buildDesignFillPeerDialogPath(subject.formId, {
      subjectUserId: subject.userId,
      subjectDisplayName: subject.displayName,
      subjectEmail: subject.email,
      serviceId,
      serviceName,
      eventId,
      occurrenceDate,
      sessionTokenId: subject.sessionTokenId ?? null,
    })
    openPeerDialog(
      {
        type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST,
        requestId,
        path,
        title: 'Fill form',
        description: `For ${subject.displayName}${serviceName ? ` · ${serviceName}` : ''}`,
        submitLabel: 'Submit',
        ...DESIGN_FORM_FILL_DIALOG_SIZE,
      },
      {
        resolve: () => {
          toast({ title: 'Form submitted', description: `Saved for ${subject.displayName}.` })
          void designFormsApi
            .listSubmissionsForSession(eventId, occurrenceDate)
            .then((result) => {
              const byTokenForm: Record<string, string> = {}
              let attendeeId: string | null = null
              const attendeeUserId = detail?.attendeeUserId
              for (const item of result.items ?? []) {
                if (item.sessionTokenId && item.formTemplateId) {
                  byTokenForm[
                    tokenFormSubmissionKey(item.sessionTokenId, item.formTemplateId)
                  ] = item.id
                } else if (attendeeUserId && item.subjectUserId === attendeeUserId) {
                  attendeeId = item.id
                }
              }
              setSubmissionByTokenForm(byTokenForm)
              setAttendeeSubmissionId(attendeeId)
            })
            .catch(() => {})
        },
        cancel: () => {},
      },
      getDesignOrigin(),
    )
  }

  function openViewForm(subject: {
    userId: string
    displayName: string
    email?: string | null
    sessionTokenId?: string | null
    submissionId: string
    formId: string
  }) {
    if (!eventId || !occurrenceDate) return
    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `form-view-${Date.now()}`
    const path = buildDesignFillPeerDialogPath(subject.formId, {
      subjectUserId: subject.userId,
      subjectDisplayName: subject.displayName,
      subjectEmail: subject.email,
      serviceId,
      serviceName,
      eventId,
      occurrenceDate,
      sessionTokenId: subject.sessionTokenId ?? null,
      mode: 'edit',
      submissionId: subject.submissionId,
    })
    openPeerDialog(
      {
        type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST,
        requestId,
        path,
        title: 'View form',
        description: `For ${subject.displayName}${serviceName ? ` · ${serviceName}` : ''}`,
        submitLabel: 'Save',
        ...DESIGN_FORM_FILL_DIALOG_SIZE,
      },
      {
        resolve: () => {
          toast({ title: 'Form saved', description: `Saved for ${subject.displayName}.` })
        },
        cancel: () => {},
      },
      getDesignOrigin(),
    )
  }

  async function handleCompleteWorkflowStep(tokenId: string) {
    if (!eventId || !occurrenceDate) return
    setCompletingTokenId(tokenId)
    try {
      await sessionTokensApi.completeWorkflow(eventId, occurrenceDate, tokenId)
      dispatch(sessionTokensActions.fetchListRequested({ eventId, occurrenceDate, silent: true }))
      dispatch(sessionCheckInsActions.fetchListRequested({ eventId, occurrenceDate }))
    } catch (err) {
      toast({
        title: t('sessionDetail.step.completeFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setCompletingTokenId(null)
    }
  }

  return (
    <FeaturePage
      title={titleDate}
      description={`${detail.serviceName} session`}
      onBack={backToEvent}
      backLabel="Back"
      actions={
        canOperateSession && runStatus === 'started' && sessionKey ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={actionBusy}
            onClick={() => dispatch(sessionTokensActions.endRequested(sessionKey))}
          >
            End session
          </Button>
        ) : undefined
      }
    >
      <SessionDetailSectionTabs
        ariaLabel={t('sessionDetail.ariaSections')}
        tab={sessionTab}
        onTabChange={setSessionTab}
        tabs={
          isDuration
            ? [{ id: 'overview', label: t('sessionDetail.tabs.overview') }]
            : [
                { id: 'overview', label: t('sessionDetail.tabs.overview') },
                ...workflowItems.map((item, index) => {
                  const spaceName =
                    item.space?.name && item.space.name !== item.space.id
                      ? item.space.name
                      : null
                  if (item.kind === 'check_in') {
                    return {
                      id: item.id,
                      label: spaceName
                        ? `${t('sessionDetail.tabs.checkIn')} · ${spaceName}`
                        : t('sessionDetail.tabs.checkIn'),
                    }
                  }
                  return {
                    id: item.id,
                    label: spaceName ?? t('sessionDetail.tabs.step', { number: index + 1 }),
                  }
                }),
              ]
        }
      >
        {sessionTab === 'overview' || isDuration ? (
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {sessionIssue ? (
            <Alert variant="destructive">
              <AlertDescription>
                {sessionIssue === 'staff_leave'
                  ? `Assigned staff (${effectiveStaffDisplayName ?? detail.staffDisplayName}) is on leave for this session. Cancel the session or reassign another staff member.`
                  : 'This session is cancelled and is hidden from customers.'}
              </AlertDescription>
            </Alert>
          ) : null}
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
                {formTemplateId && detail.attendeeUserId ? (
                  attendeeSubmissionId ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusTag variant="verified">Form submitted</StatusTag>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 text-sm"
                        onClick={() =>
                          openViewForm({
                            userId: detail.attendeeUserId!,
                            displayName: detail.attendeeDisplayName ?? 'Customer',
                            email: detail.attendeeEmail,
                            submissionId: attendeeSubmissionId,
                            formId: formTemplateId,
                          })
                        }
                      >
                        View form
                      </Button>
                    </div>
                  ) : canOperateSession ? (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-sm"
                      onClick={() =>
                        openFillForm({
                          userId: detail.attendeeUserId!,
                          displayName: detail.attendeeDisplayName ?? 'Customer',
                          email: detail.attendeeEmail,
                          formId: formTemplateId,
                        })
                      }
                    >
                      Fill form
                    </Button>
                  ) : null
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          {isDuration ? (
            <DurationSessionWorkflowCard
              items={workflowItems}
              token={durationAttendeeToken}
              canComplete={canOperateSession}
              completingId={completingTokenId}
              checkedIn={Boolean(
                detail.attendeeUserId && checkedInUserIds.has(detail.attendeeUserId),
              )}
              canFillForms={canOperateSession}
              submissionByTokenForm={submissionByTokenForm}
              onFillForm={(formId) => {
                if (!durationAttendeeToken) return
                openFillForm({
                  userId: durationAttendeeToken.userId,
                  displayName: durationAttendeeToken.userDisplayName,
                  email: durationAttendeeToken.userEmail,
                  sessionTokenId: durationAttendeeToken.id,
                  formId,
                })
              }}
              onViewForm={(formId, submissionId) => {
                if (!durationAttendeeToken) return
                openViewForm({
                  userId: durationAttendeeToken.userId,
                  displayName: durationAttendeeToken.userDisplayName,
                  email: durationAttendeeToken.userEmail,
                  sessionTokenId: durationAttendeeToken.id,
                  formId,
                  submissionId,
                })
              }}
              onComplete={() => {
                if (!durationAttendeeToken || !eventId || !occurrenceDate) return
                void handleCompleteWorkflowStep(durationAttendeeToken.id)
              }}
            />
          ) : null}
          {!isDuration ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg">Tokens</CardTitle>
                  <CardDescription>
                    Queue tokens issued for users at this session
                  </CardDescription>
                </div>
                {canOperateSession ? (
                  <Button type="button" size="sm" onClick={() => setIssueOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Issue new token
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {tokensError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{tokensError}</AlertDescription>
                  </Alert>
                ) : tokensStatus === 'loading' && tokens.length === 0 ? null : tokens.length === 0 ? (
                  <ItemListEmpty>
                    {isPersonal ? 'No token for your account yet.' : 'No tokens issued yet.'}
                  </ItemListEmpty>
                ) : (
                  <ItemList>
                    {overviewTokens.map((token) => {
                      const isCheckedIn = checkedInUserIds.has(token.userId)
                      const notCheckedIn = token.status === 'waiting' && !isCheckedIn
                      return (
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
                              <TokenWorkflowProgress progress={token.workflowProgress} />
                              <p className="truncate text-sm text-foreground">
                                {token.userDisplayName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {token.userEmail ?? 'No email'}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <StatusTag variant={TOKEN_STATUS_VARIANT[token.status]}>
                                {TOKEN_STATUS_LABEL[token.status]}
                              </StatusTag>
                              {isCheckedIn ? (
                                <StatusTag variant="verified">
                                  {t('session.tokenStatus.checkedIn')}
                                </StatusTag>
                              ) : null}
                              {notCheckedIn ? (
                                <StatusTag variant="pending">
                                  {t('session.tokenStatus.notCheckedIn')}
                                </StatusTag>
                              ) : null}
                            </div>
                          </div>
                        </ItemListContent>
                      </ItemListItem>
                      )
                    })}
                  </ItemList>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session controls</CardTitle>
              <CardDescription>
                {isDuration
                  ? 'Start or end this appointment session'
                  : 'Start the session. Operate the queue on workflow steps that enable it.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canOperateSession && runStatus === 'scheduled' && sessionKey ? (
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

              {!isDuration && runStatus === 'started' ? (
                <p className="text-sm text-muted-foreground">
                  Use Previous and Next on workflow steps that have session queue enabled.
                </p>
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
                value={`${effectiveStartTime}–${effectiveEndTime}`}
              />
              <SessionScheduleChangeMeta
                scheduleChanged={scheduleChanged}
                scheduleChangeKind={scheduleChangeKind}
                originalStartTime={detail.startTime}
                originalEndTime={detail.endTime}
              />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <StatusTag variant={RUN_STATUS_VARIANT[runStatus]}>
                  {RUN_STATUS_LABEL[runStatus]}
                </StatusTag>
              </div>
            </CardContent>
          </Card>

          {canChangeSession(activeRole, activeCompanyId, isAssignedStaff) ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change session</CardTitle>
                <CardDescription>
                  Delay this session’s start and optionally notify attendees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canEditSessionSchedule ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={() => setChangeOpen(true)}
                  >
                    Change session
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Schedule can only be changed while the session is scheduled.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

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
              <DetailField
                label="Name"
                value={effectiveStaffDisplayName ?? detail.staffDisplayName}
              />
              {canManageSession && sessionKey ? (
                <div className="flex flex-wrap gap-2">
                  {sessionIssue !== 'cancelled' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={cancelBusy}
                      onClick={() => {
                        if (!window.confirm('Cancel this session for customers?')) return
                        setCancelBusy(true)
                        void sessionTokensApi
                          .cancel(sessionKey.eventId, sessionKey.occurrenceDate)
                          .then(() =>
                            dispatch(
                              sessionTokensActions.fetchListRequested({
                                eventId: sessionKey.eventId,
                                occurrenceDate: sessionKey.occurrenceDate,
                              }),
                            ),
                          )
                          .finally(() => setCancelBusy(false))
                      }}
                    >
                      Cancel session
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setReassignOpen(true)}
                  >
                    Reassign staff
                  </Button>
                </div>
              ) : null}
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
        ) : (
          (() => {
            const item =
              workflowItems.find((entry) => entry.id === sessionTab) ?? workflowItems[0]
            if (!item) return null
            const atStep = tokensAtWorkflowStep(tokens, item.id)
            const stepTokens =
              item.kind === 'check_in'
                ? overviewTokens.filter(
                    (token) =>
                      atStep.some((entry) => entry.id === token.id) ||
                      checkedInUserIds.has(token.userId),
                  )
                : overviewTokens.filter((token) => checkedInUserIds.has(token.userId))
            return (
              <SessionWorkflowStepPanel
                item={item}
                items={workflowItems}
                tokens={tokens}
                stepTokens={stepTokens}
                showQueue={!isDuration && Boolean(item.sessionQueue)}
                canComplete={canOperateSession}
                completingId={completingTokenId}
                checkedInUserIds={checkedInUserIds}
                canFillForms={canOperateSession}
                submissionByTokenForm={submissionByTokenForm}
                onFillForm={(token, formId) => {
                  openFillForm({
                    userId: token.userId,
                    displayName: token.userDisplayName,
                    email: token.userEmail,
                    sessionTokenId: token.id,
                    formId,
                  })
                }}
                onViewForm={(token, formId, submissionId) => {
                  openViewForm({
                    userId: token.userId,
                    displayName: token.userDisplayName,
                    email: token.userEmail,
                    sessionTokenId: token.id,
                    formId,
                    submissionId,
                  })
                }}
                onComplete={(tokenId) => {
                  if (!eventId || !occurrenceDate) return
                  void handleCompleteWorkflowStep(tokenId)
                }}
              />
            )
          })()
        )}
      </SessionDetailSectionTabs>

      {!isDuration && canOperateSession ? (
        <IssueTokenDialog
          open={issueOpen}
          eventId={eventId}
          occurrenceDate={occurrenceDate}
          onOpenChange={setIssueOpen}
        />
      ) : null}

      {canChangeSession(activeRole, activeCompanyId, isAssignedStaff) &&
      eventId &&
      occurrenceDate ? (
        <ChangeSessionDialog
          open={changeOpen}
          eventId={eventId}
          occurrenceDate={occurrenceDate}
          currentStartTime={effectiveStartTime}
          currentEndTime={effectiveEndTime}
          relatedMemberCount={relatedMemberCount}
          onOpenChange={setChangeOpen}
        />
      ) : null}

      {canManageSession && eventId && occurrenceDate ? (
        <ReassignSessionStaffDialog
          open={reassignOpen}
          eventId={eventId}
          occurrenceDate={occurrenceDate}
          currentStaffId={detail.staffId}
          onOpenChange={setReassignOpen}
          onReassigned={() =>
            dispatch(
              sessionTokensActions.fetchListRequested({
                eventId,
                occurrenceDate,
              }),
            )
          }
        />
      ) : null}
    </FeaturePage>
  )
}

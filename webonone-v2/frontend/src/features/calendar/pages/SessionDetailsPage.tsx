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
  ContactValueLine,
  FeaturePage,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ImagePreview,
  StatusTag,
  itemListThumbClassName,
  useToast,
  type StatusTagVariant,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { IssueTokenDialog } from '@/features/calendar/components/IssueTokenDialog'
import { ChangeSessionDialog } from '@/features/calendar/components/ChangeSessionDialog'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { formatTimeModeLabel } from '@/features/calendar/schemas/eventSchemas'
import { eventsActions, sessionCheckInsActions, sessionTokensActions } from '@/features/calendar/store'
import { useSessionTokenAvatars } from '@/features/calendar/hooks/useSessionTokenAvatars'
import { SessionDetailSectionTabs } from '@/features/calendar/components/SessionDetailSectionTabs'
import { SessionWorkflowTab } from '@/features/calendar/components/SessionWorkflowTab'
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
import { resolvePosEnabledKinds } from '@/features/sales/utils/posEnabledKinds'
import { ReassignSessionStaffDialog } from '@/features/calendar/components/ReassignSessionStaffDialog'
import { sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'
import { SessionControlTimingField } from '@/features/calendar/components/SessionControlTimingField'
import { expandEventOccurrences } from '@/features/calendar/utils/expandEventOccurrences'
import {
  buildScheduledSessionInstant,
  resolveSessionControlEnded,
  resolveSessionControlStarted,
} from '@/features/calendar/utils/sessionControlTiming'
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { usePlatformPeerDialog } from '@/features/shell/PlatformPeerDialogContext'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
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
  const assumableRoles = useAppSelector((s) => s.sessionRole.assumableRoles)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const detail = useAppSelector((s) => s.events.detail) as CompanyEvent | null
  const detailStatus = useAppSelector((s) => s.events.detailStatus)
  const detailError = useAppSelector((s) => s.events.detailError)
  const tokens = useAppSelector((s) => s.sessionTokens.items)
  const displayTokens = useSessionTokenAvatars(tokens)
  const run = useAppSelector((s) => s.sessionTokens.run)
  const sessionStepQueues = useAppSelector((s) => s.sessionTokens.stepQueues)
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
  const sessionAssignedStaff = useAppSelector((s) => s.sessionTokens.viewerIsAssignedStaff)
  const [submissionByTokenForm, setSubmissionByTokenForm] = useState<Record<string, string>>({})
  const [attendeeSubmissionId, setAttendeeSubmissionId] = useState<string | null>(null)
  const lastActionStatus = useRef(actionStatus)
  const isPersonal = isPersonalCalendarSession(activeRole, activeCompanyId)
  const { t, i18n } = useTranslation('calendar')
  const { t: tSales } = useTranslation('sales')
  const [sessionTab, setSessionTab] = useState('overview')
  const [selectedWorkflowStepId, setSelectedWorkflowStepId] = useState('')
  const [workflowItems, setWorkflowItems] = useState<ServiceWorkflowItem[]>([])
  const [completingTokenId, setCompletingTokenId] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

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
    if (workflowItems.some((item) => item.id === selectedWorkflowStepId)) return
    setSelectedWorkflowStepId(workflowItems[0]?.id ?? '')
  }, [workflowItems, selectedWorkflowStepId])

  useEffect(() => {
    if (workflowItems.length === 0 && sessionTab === 'workflow') {
      setSessionTab('overview')
    }
  }, [sessionTab, workflowItems.length])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

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
            addItemsEnabled: Boolean(item.addItemsEnabled),
            addItemsFromLibraryEnabled: Boolean(item.addItemsFromLibraryEnabled),
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
    if (sessionTab !== 'workflow' || detail?.timeMode !== 'duration') return
    if (!eventId || !occurrenceDate || !DATE_YMD.test(occurrenceDate)) return
    dispatch(
      sessionTokensActions.fetchListRequested({
        eventId,
        occurrenceDate,
        silent: true,
      }),
    )
  }, [sessionTab, detail?.timeMode, dispatch, eventId, occurrenceDate])

  const isAssignedStaff =
    activeRole === 'member' &&
    Boolean(activeCompanyId) &&
    (sessionAssignedStaff || detail?.viewerIsAssignedStaff === true)

  useEffect(() => {
    if (lastActionStatus.current === 'saving' && actionStatus === 'idle' && !actionError) {
      if (lastAction === 'start') {
        toast({ title: 'Session started' })
        if (eventId && occurrenceDate && DATE_YMD.test(occurrenceDate)) {
          dispatch(
            sessionTokensActions.fetchListRequested({
              eventId,
              occurrenceDate,
              silent: true,
            }),
          )
        }
      }
      if (lastAction === 'call-next') toast({ title: 'Next token called' })
      if (lastAction === 'call-previous') toast({ title: 'Moved to previous token' })
      if (lastAction === 'end') {
        toast({ title: 'Session ended' })
        setIssueOpen(false)
      }
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
  }, [actionStatus, actionError, dispatch, eventId, lastAction, occurrenceDate, toast])

  function handleSaleCompleted(customerEmail?: string | null) {
    if (eventId && occurrenceDate && DATE_YMD.test(occurrenceDate)) {
      dispatch(
        sessionTokensActions.fetchListRequested({
          eventId,
          occurrenceDate,
          silent: true,
        }),
      )
    }
    const email = customerEmail?.trim() || detail?.attendeeEmail?.trim() || null
    toast({
      title: tSales('tokenBill.closed'),
      description: email ? tSales('tokenBill.emailSent') : undefined,
    })
  }

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
  const canOperateSession = canAccessCompanySession(activeRole, activeCompanyId) && !sessionIssue
  const canSellDuringSession = canOperateSession && runStatus === 'started'
  const checkedInUserIds = useMemo(
    () => new Set(checkIns.map((item) => item.userId)),
    [checkIns],
  )
  const overviewTokens = useMemo(() => {
    return [...displayTokens].sort((a, b) => {
      const aInQueue =
        checkedInUserIds.has(a.userId) || a.status === 'serving' || a.status === 'completed'
      const bInQueue =
        checkedInUserIds.has(b.userId) || b.status === 'serving' || b.status === 'completed'
      if (aInQueue !== bInQueue) return aInQueue ? -1 : 1
      return a.tokenNumber - b.tokenNumber
    })
  }, [checkedInUserIds, displayTokens])
  const posEnabledKinds = useMemo(
    () =>
      resolvePosEnabledKinds(
        assumableRoles.find((role) => role.companyId === activeCompanyId)?.dataEntities,
      ),
    [assumableRoles, activeCompanyId],
  )
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
    displayTokens.find((token) => token.userId === detail.attendeeUserId) ??
    displayTokens[0] ??
    null
  const showAttendee =
    isDuration || Boolean(detail.attendeeDisplayName || detail.attendeeUserId)
  const canIssueTokens = canOperateSession && runStatus !== 'ended'
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
  const titleDate = formatCalendarYmd(session.occurrenceDate, i18n.language)
  const scheduledStartIso = buildScheduledSessionInstant(
    session.occurrenceDate,
    effectiveStartTime,
  )
  const scheduledEndIso = buildScheduledSessionInstant(
    session.occurrenceDate,
    effectiveEndTime,
  )
  const sessionControlTimingInput = {
    runStatus,
    now,
    language: i18n.language,
    scheduledStartIso,
    scheduledEndIso,
    startedAt: run?.startedAt,
    endedAt: run?.endedAt,
  }
  const startedControlDisplay = resolveSessionControlStarted(sessionControlTimingInput)
  const endedControlDisplay = resolveSessionControlEnded(sessionControlTimingInput)
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
          workflowItems.length > 0
            ? [
                { id: 'overview', label: t('sessionDetail.tabs.overview') },
                { id: 'workflow', label: t('sessionDetail.tabs.workflow') },
              ]
            : [{ id: 'overview', label: t('sessionDetail.tabs.overview') }]
        }
      >
        {sessionTab === 'overview' ? (
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
          {!isDuration ? (
            <Card variant="list">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg">Tokens</CardTitle>
                  <CardDescription>
                    {runStatus === 'ended'
                      ? t('sessionDetail.tokens.endedDescription')
                      : t('sessionDetail.tokens.description')}
                  </CardDescription>
                </div>
                {canIssueTokens ? (
                  <Button type="button" size="sm" onClick={() => setIssueOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    {t('sessionDetail.tokens.issueNew')}
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
                  <ItemList className="py-0">
                    {overviewTokens.map((token) => {
                      const isCheckedIn = checkedInUserIds.has(token.userId)
                      const tokenStatusTag =
                        token.status === 'waiting' ? (
                          isCheckedIn ? (
                            <StatusTag variant="verified">
                              {t('session.tokenStatus.checkedIn')}
                            </StatusTag>
                          ) : (
                            <StatusTag variant="pending">
                              {t('session.tokenStatus.notCheckedIn')}
                            </StatusTag>
                          )
                        ) : (
                          <StatusTag variant={TOKEN_STATUS_VARIANT[token.status]}>
                            {TOKEN_STATUS_LABEL[token.status]}
                          </StatusTag>
                        )
                      return (
                      <ItemListItem
                        key={token.id}
                        className={
                          token.status === 'serving'
                            ? 'ring-1 ring-primary/40'
                            : undefined
                        }
                      >
                        <ImagePreview
                          src={token.userAvatarUrl}
                          alt={token.userDisplayName}
                          mode="view"
                          className={itemListThumbClassName}
                        />
                        <ItemListContent>
                          <div className="flex w-full min-w-0 flex-col gap-3">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="truncate font-medium text-foreground">
                                  {token.tokenLabel}
                                </p>
                                <p className="truncate text-sm text-foreground">
                                  {token.userDisplayName}
                                </p>
                                <ContactValueLine
                                  kind="email"
                                  value={token.userEmail}
                                  emptyLabel="No email"
                                />
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {tokenStatusTag}
                              </div>
                            </div>
                            <TokenWorkflowProgress
                              progress={token.workflowProgress}
                              layout="footer"
                            />
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
              <CardTitle className="text-lg">{t('sessionDetail.controls.title')}</CardTitle>
              <CardDescription>
                {isDuration
                  ? t('sessionDetail.controls.descriptionDuration')
                  : t('sessionDetail.controls.descriptionWindow')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('sessionDetail.controls.status')}
                  </p>
                  <StatusTag variant={RUN_STATUS_VARIANT[runStatus]}>
                    {RUN_STATUS_LABEL[runStatus]}
                  </StatusTag>
                </div>
                <SessionControlTimingField
                  label={t('sessionDetail.controls.startedAt')}
                  display={startedControlDisplay}
                  t={t}
                />
                <SessionControlTimingField
                  label={t('sessionDetail.controls.endedAt')}
                  display={endedControlDisplay}
                  t={t}
                />
              </div>

              {canOperateSession && runStatus === 'scheduled' && sessionKey ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={actionBusy}
                  onClick={() => dispatch(sessionTokensActions.startRequested(sessionKey))}
                >
                  {t('sessionDetail.controls.startSession')}
                </Button>
              ) : null}

              {!isDuration && runStatus === 'started' ? (
                <p className="text-sm text-muted-foreground">
                  {t('sessionDetail.controls.queueHint')}
                </p>
              ) : null}

              {isDuration && runStatus === 'started' ? (
                <p className="text-sm text-muted-foreground">
                  {t('sessionDetail.controls.durationInProgress')}
                </p>
              ) : null}

              {isDuration && runStatus === 'ended' ? (
                <p className="text-sm text-muted-foreground">
                  {t('sessionDetail.controls.durationEnded')}
                </p>
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
                value={effectiveStaffDisplayName ?? detail.staffDisplayName ?? '—'}
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
          <SessionWorkflowTab
            isDuration={isDuration}
            workflowItems={workflowItems}
            selectedWorkflowStepId={selectedWorkflowStepId}
            onSelectWorkflowStep={setSelectedWorkflowStepId}
            displayTokens={displayTokens}
            overviewTokens={overviewTokens}
            checkedInUserIds={checkedInUserIds}
            durationAttendeeToken={durationAttendeeToken}
            canOperateSession={canOperateSession}
            canManageSession={canManageSession}
            isAssignedStaff={isAssignedStaff}
            completingTokenId={completingTokenId}
            submissionByTokenForm={submissionByTokenForm}
            onFillForm={openFillForm}
            onViewForm={openViewForm}
            onCompleteWorkflowStep={(tokenId) => {
              if (!eventId || !occurrenceDate) return
              void handleCompleteWorkflowStep(tokenId)
            }}
            serviceId={detail.serviceId}
            serviceName={detail.serviceName}
            enabledKinds={posEnabledKinds}
            canSellDuringSession={canSellDuringSession}
            sessionStepQueues={sessionStepQueues}
            isPersonal={isPersonal}
            onSaleCompleted={handleSaleCompleted}
          />
        )}
      </SessionDetailSectionTabs>

      {!isDuration && canIssueTokens ? (
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

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  ImageCarousel,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { EditableSectionCard } from '@/features/calendar/components/EditableSectionCard'
import {
  EventDetailSectionTabs,
  type EventDetailTabId,
} from '@/features/calendar/components/EventDetailSectionTabs'
import { EventFormDialog } from '@/features/calendar/components/EventFormDialog'
import { EventSessionsList } from '@/features/calendar/components/EventSessionsList'
import {
  formatRecurrenceLabel,
  formatTimeModeLabel,
  formatWeekdaysLabel,
  type EventWizardStep,
} from '@/features/calendar/schemas/eventSchemas'
import { eventsActions } from '@/features/calendar/store'
import type { CompanyEvent, EventGalleryImage } from '@/features/calendar/types/event.types'
import { designFormsApi } from '@/features/design/services/designFormsApi'
import {
  canAccessCompanySession,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/session/utils/canAccessCompanySession'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'

const EVENT_DETAIL_TAB_PARAM = ['overview', 'upcoming', 'past', 'sessions'] as const

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function combineEventGalleryImages(detail: CompanyEvent): EventGalleryImage[] {
  const seen = new Set<string>()
  const combined: EventGalleryImage[] = []
  for (const image of [
    ...(detail.serviceGalleryImages ?? []),
    ...(detail.spaceGalleryImages ?? []),
  ]) {
    if (!image.mediaId || seen.has(image.mediaId)) continue
    seen.add(image.mediaId)
    combined.push(image)
  }
  return combined
}

export function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const detail = useAppSelector((s) => s.events.detail) as CompanyEvent | null
  const detailStatus = useAppSelector((s) => s.events.detailStatus)
  const detailError = useAppSelector((s) => s.events.detailError)

  const { t } = useTranslation('calendar')
  const [dialog, setDialog] = useState<{ initialStep: EventWizardStep } | null>(null)
  const [rawTab, setTab] = useDetailTabParam(EVENT_DETAIL_TAB_PARAM, 'overview')
  const tab: EventDetailTabId = rawTab === 'sessions' ? 'upcoming' : rawTab
  const [linkedFormName, setLinkedFormName] = useState<string | null>(null)

  const loading = detailStatus === 'loading' && !detail
  usePlatformLoading(loading ? 'Loading event…' : null)

  useEffect(() => {
    if (rawTab !== 'sessions') return
    setTab('upcoming')
  }, [rawTab, setTab])

  useEffect(() => {
    if (!eventId) return
    dispatch(eventsActions.fetchDetailRequested({ id: eventId, force: true }))
    return () => {
      dispatch(eventsActions.resetDetail())
    }
  }, [dispatch, eventId])

  useEffect(() => {
    if (!detail?.formTemplateId) {
      setLinkedFormName(null)
      return
    }
    let cancelled = false
    designFormsApi
      .listPublished()
      .then((result) => {
        if (cancelled) return
        const match = result.items.find((item) => item.id === detail.formTemplateId)
        setLinkedFormName(match?.name ?? detail.formTemplateId)
      })
      .catch(() => {
        if (!cancelled) setLinkedFormName(detail.formTemplateId)
      })
    return () => {
      cancelled = true
    }
  }, [detail?.formTemplateId])

  const canEdit = selectionComplete && canManageCompanyEvents(activeRole, activeCompanyId)
  const isDuration = detail?.timeMode === 'duration'

  function openWizard(initialStep: EventWizardStep) {
    setDialog({ initialStep })
  }

  if (
    selectionComplete &&
    !canAccessCompanySession(activeRole, activeCompanyId) &&
    !isPersonalCalendarSession(activeRole, activeCompanyId)
  ) {
    return (
      <FeaturePage title="Event" description="Event details">
        <Alert variant="destructive">
          <AlertDescription>Company session required.</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (loading) {
    return null
  }

  if (detailError && !detail) {
    return (
      <FeaturePage
        title="Event"
        description="Event details"
        onBack={() => navigate('/calendar/events')}
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

  const showAttendee = isDuration || Boolean(detail.attendeeDisplayName || detail.attendeeUserId)
  const overviewGalleryImages = combineEventGalleryImages(detail)

  const overviewPanel = (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {overviewGalleryImages.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <ImageCarousel images={overviewGalleryImages} alt={detail.serviceName} />
            </CardContent>
          </Card>
        ) : null}

        <EditableSectionCard
          title="Service"
          description="Catalog service for this event"
          canEdit={canEdit}
          onEdit={() => openWizard(1)}
        >
          <DetailField label="Name" value={detail.serviceName} />
          <DetailField label="Time mode" value={formatTimeModeLabel(detail.timeMode)} />
        </EditableSectionCard>

        <EditableSectionCard
          title="When"
          description={
            isDuration ? 'Date, start time, and optional recurrence' : 'Weekdays, date range, and times'
          }
          canEdit={canEdit}
          onEdit={() => openWizard(4)}
        >
          {isDuration ? (
            <>
              <DetailField
                label="Schedule"
                value={formatRecurrenceLabel(detail.recurrence, {
                  startsOn: detail.startsOn,
                  weekdays: detail.weekdays,
                })}
              />
              <DetailField
                label={detail.recurrence === 'none' ? 'Date' : 'From'}
                value={detail.startsOn}
              />
              {detail.recurrence !== 'none' ? (
                <DetailField label="Until" value={detail.recurrenceUntil ?? '—'} />
              ) : null}
              <DetailField label="Time" value={`${detail.startTime}–${detail.endTime}`} />
            </>
          ) : (
            <>
              <DetailField
                label="Weekdays"
                value={detail.weekdays.length > 0 ? formatWeekdaysLabel(detail.weekdays) : '—'}
              />
              <DetailField label="From" value={detail.startsOn} />
              <DetailField label="Until" value={detail.recurrenceUntil ?? '—'} />
              <DetailField label="Time" value={`${detail.startTime}–${detail.endTime}`} />
            </>
          )}
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title="Staff"
          description="Staff member delivering the service"
          canEdit={canEdit}
          onEdit={() => openWizard(2)}
        >
          <DetailField label="Name" value={detail.staffDisplayName} />
        </EditableSectionCard>

        {!isDuration ? (
          <EditableSectionCard
            title="Where"
            description="Space where this event happens"
            canEdit={canEdit}
            onEdit={() => openWizard(3)}
          >
            <DetailField label="Space" value={detail.spaceName ?? '—'} />
          </EditableSectionCard>
        ) : null}

        {showAttendee ? (
          <EditableSectionCard
            title="Attendee"
            description="Identity user attending this event"
            canEdit={canEdit && isDuration}
            onEdit={isDuration ? () => openWizard(3) : undefined}
          >
            <DetailField label="Name" value={detail.attendeeDisplayName ?? '—'} />
            <DetailField label="Email" value={detail.attendeeEmail ?? '—'} />
          </EditableSectionCard>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Forms</CardTitle>
            <CardDescription>
              Design form linked to this event&apos;s service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.formTemplateId ? (
              <>
                <DetailField label="Linked form" value={linkedFormName ?? detail.formTemplateId} />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/design/forms/${detail.formTemplateId}`)}
                >
                  Open form
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No form linked to this service. Link a form on the service catalog page.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Record</CardTitle>
            <CardDescription>Event record metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailField
              label="Created"
              value={new Date(detail.createdAt).toLocaleString()}
            />
            <DetailField
              label="Updated"
              value={new Date(detail.updatedAt).toLocaleString()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <FeaturePage
      title={detail.serviceName}
      description="Company calendar event details."
      onBack={() => navigate('/calendar/events')}
      backLabel="Back"
    >
      <EventDetailSectionTabs
        ariaLabel={t('eventDetail.ariaSections')}
        tab={tab}
        onTabChange={(next) => setTab(next)}
        overview={overviewPanel}
        upcoming={
          <EventSessionsList
            event={detail}
            listTab="upcoming"
            personalOnly={isPersonalCalendarSession(activeRole, activeCompanyId)}
            canExpand={canEdit}
            onExpanded={() =>
              dispatch(eventsActions.fetchDetailRequested({ id: eventId, force: true }))
            }
          />
        }
        past={
          <EventSessionsList
            event={detail}
            listTab="past"
            personalOnly={isPersonalCalendarSession(activeRole, activeCompanyId)}
            canExpand={canEdit}
            onExpanded={() =>
              dispatch(eventsActions.fetchDetailRequested({ id: eventId, force: true }))
            }
          />
        }
      />

      {dialog && canEdit ? (
        <EventFormDialog
          open
          id={eventId}
          initialStep={dialog.initialStep}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => {
            dispatch(eventsActions.fetchDetailRequested({ id: eventId, force: true }))
            setDialog(null)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
  formatTimeModeLabel,
  formatWeekdaysLabel,
  type EventWizardStep,
} from '@/features/calendar/schemas/eventSchemas'
import { eventsActions } from '@/features/calendar/store'
import type { CompanyEvent } from '@/features/calendar/types/event.types'
import { canAccessCompanySession } from '@/features/session/utils/canAccessCompanySession'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'

const EVENT_DETAIL_TABS = ['details', 'sessions'] as const satisfies readonly EventDetailTabId[]

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
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

  const [dialog, setDialog] = useState<{ initialStep: EventWizardStep } | null>(null)
  const [tab, setTab] = useDetailTabParam(EVENT_DETAIL_TABS, 'details')

  const loading = detailStatus === 'loading' && !detail
  usePlatformLoading(loading ? 'Loading event…' : null)

  useEffect(() => {
    if (!eventId) return
    dispatch(eventsActions.fetchDetailRequested({ id: eventId, force: true }))
    return () => {
      dispatch(eventsActions.resetDetail())
    }
  }, [dispatch, eventId])

  const canEdit = selectionComplete && canAccessCompanySession(activeRole, activeCompanyId)
  const isDuration = detail?.timeMode === 'duration'

  function openWizard(initialStep: EventWizardStep) {
    setDialog({ initialStep })
  }

  if (selectionComplete && !canAccessCompanySession(activeRole, activeCompanyId)) {
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
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/calendar/events')}
          >
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

  const showAttendee = isDuration || Boolean(detail.attendeeDisplayName || detail.attendeeUserId)

  const detailsPanel = (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
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
          description="Weekdays, date range, and times"
          canEdit={canEdit}
          onEdit={() => openWizard(isDuration ? 4 : 3)}
        >
          <DetailField
            label="Weekdays"
            value={detail.weekdays.length > 0 ? formatWeekdaysLabel(detail.weekdays) : '—'}
          />
          <DetailField label="From" value={detail.startsOn} />
          <DetailField label="Until" value={detail.recurrenceUntil ?? '—'} />
          <DetailField label="Time" value={`${detail.startTime}–${detail.endTime}`} />
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
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/calendar/events')}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
      }
    >
      <EventDetailSectionTabs
        ariaLabel="Event sections"
        tab={tab}
        onTabChange={setTab}
        details={detailsPanel}
        sessions={<EventSessionsList event={detail} />}
      />

      {dialog ? (
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

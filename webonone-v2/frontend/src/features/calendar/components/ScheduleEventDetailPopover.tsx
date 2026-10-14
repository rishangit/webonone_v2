import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, X } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  ImagePreview,
  StatusTag,
  cn,
  type StatusTagVariant,
} from '@webonone/ui-kit'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { formatTimeModeLabel } from '@/features/calendar/schemas/eventSchemas'
import type {
  CompanyEventOccurrence,
  SessionRunStatus,
} from '@/features/calendar/types/event.types'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import { useAppSelector } from '@/app/store/hooks'
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'
import { overlayIdentityFromSessionUser } from '@/shared/utils/overlayIdentityFromSessionUser'

const RUN_STATUS_VARIANT: Record<SessionRunStatus, StatusTagVariant> = {
  scheduled: 'pending',
  started: 'verified',
  ended: 'member',
}

const POPOVER_FIELD_THUMB_CLASS = 'h-8 w-8 shrink-0 rounded-md'

type ScheduleEventDetailPopoverProps = {
  occurrence: CompanyEventOccurrence
  onClose: () => void
  layout?: 'popover' | 'panel'
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function DetailFieldWithImage({
  label,
  value,
  imageUrl,
  imageAlt,
}: {
  label: string
  value: string
  imageUrl?: string | null
  imageAlt: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <ImagePreview
          src={imageUrl ?? null}
          alt={imageAlt}
          mode="view"
          className={POPOVER_FIELD_THUMB_CLASS}
        />
        <p className="min-w-0 text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

function weekdayLabel(ymd: string): string {
  const date = new Date(`${ymd}T12:00:00`)
  return DAY_LABELS[date.getDay()] ?? `D${date.getDay()}`
}

export function ScheduleEventDetailPopover({
  occurrence,
  onClose,
  layout = 'popover',
}: ScheduleEventDetailPopoverProps) {
  const { t, i18n } = useTranslation('calendar')
  const sessionUser = useAppSelector((s) => s.auth.user)
  const isPanel = layout === 'panel'
  const displayOccurrence = overlayIdentityFromSessionUser(occurrence, sessionUser, {
    userId: 'attendeeUserId',
    displayName: 'attendeeDisplayName',
    email: 'attendeeEmail',
    avatarUrl: 'attendeeImageUrl',
  })

  const staffName =
    displayOccurrence.effectiveStaffDisplayName ?? displayOccurrence.staffDisplayName ?? '—'
  const runStatus = displayOccurrence.runStatus ?? 'scheduled'
  const isDuration = displayOccurrence.timeMode === 'duration'
  const isWindow = displayOccurrence.timeMode === 'window'
  const sessionPath = `/calendar/events/${displayOccurrence.id}/sessions/${displayOccurrence.occurrenceDate}`

  return (
    <div className="flex flex-col">
      {!isPanel ? (
        <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-medium text-foreground">{displayOccurrence.serviceName}</p>
            <p className="text-xs text-muted-foreground">
              {t('session.subtitle', { serviceName: displayOccurrence.serviceName })}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={t('schedule.eventPreview.close')}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      <div className={cn('space-y-4', isPanel ? 'py-0' : 'px-3 py-3')}>
        {displayOccurrence.sessionIssue === 'staff_leave' ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t('schedule.issue.staffLeaveDetail', { name: staffName })}
            </AlertDescription>
          </Alert>
        ) : null}
        {displayOccurrence.sessionIssue === 'cancelled' ? (
          <Alert variant="destructive">
            <AlertDescription>{t('schedule.issue.cancelledDetail')}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <DetailField
            label={t('schedule.eventPreview.date')}
            value={formatCalendarYmd(displayOccurrence.occurrenceDate, i18n.language)}
          />
          <DetailField
            label={t('schedule.eventPreview.weekday')}
            value={weekdayLabel(displayOccurrence.occurrenceDate)}
          />
          <DetailField
            label={t('schedule.eventPreview.time')}
            value={`${displayOccurrence.startTime}–${displayOccurrence.endTime}`}
          />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t('schedule.eventPreview.status')}
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusTag
                variant={
                  displayOccurrence.sessionIssue ? 'rejected' : RUN_STATUS_VARIANT[runStatus]
                }
              >
                {displayOccurrence.sessionIssue === 'staff_leave'
                  ? t('schedule.issue.staffLeaveShort')
                  : displayOccurrence.sessionIssue === 'cancelled'
                    ? t('schedule.issue.cancelledShort')
                    : t(`sessionStatus.${runStatus}`)}
              </StatusTag>
              {displayOccurrence.viewerCheckedIn === true ? (
                <StatusTag variant="verified">
                  {t('session.tokenStatus.checkedIn')}
                </StatusTag>
              ) : displayOccurrence.viewerCheckedIn === false ? (
                <StatusTag variant="pending">
                  {t('session.tokenStatus.notCheckedIn')}
                </StatusTag>
              ) : null}
            </div>
          </div>
        </div>

        <SessionScheduleChangeMeta
          scheduleChanged={displayOccurrence.scheduleChanged}
          scheduleChangeKind={displayOccurrence.scheduleChangeKind}
          originalStartTime={displayOccurrence.originalStartTime}
          originalEndTime={displayOccurrence.originalEndTime}
        />

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <DetailFieldWithImage
            label={t('schedule.eventPreview.service')}
            value={displayOccurrence.serviceName}
            imageUrl={displayOccurrence.serviceImageUrl}
            imageAlt={displayOccurrence.serviceName}
          />
          <DetailField
            label={t('schedule.eventPreview.timeMode')}
            value={formatTimeModeLabel(displayOccurrence.timeMode)}
          />
          <DetailFieldWithImage
            label={t('schedule.eventPreview.staff')}
            value={staffName}
            imageUrl={displayOccurrence.staffImageUrl}
            imageAlt={staffName}
          />
          {isWindow ? (
            <DetailField
              label={t('schedule.eventPreview.space')}
              value={displayOccurrence.spaceName ?? '—'}
            />
          ) : null}
        </div>
        {isDuration ? (
          <div className="grid grid-cols-2 gap-3">
            <DetailFieldWithImage
              label={t('schedule.eventPreview.attendee')}
              value={displayOccurrence.attendeeDisplayName ?? '—'}
              imageUrl={displayOccurrence.attendeeImageUrl}
              imageAlt={displayOccurrence.attendeeDisplayName ?? t('schedule.eventPreview.attendee')}
            />
            <DetailField
              label={t('schedule.eventPreview.email')}
              value={displayOccurrence.attendeeEmail ?? '—'}
            />
          </div>
        ) : null}

        <Link
          to={sessionPath}
          onClick={onClose}
          className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('schedule.eventPreview.openSession')}
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

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
import { formatCalendarYmd } from '@/shared/utils/formatLocaleDate'

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
  const isPanel = layout === 'panel'

  const staffName = occurrence.effectiveStaffDisplayName ?? occurrence.staffDisplayName ?? '—'
  const runStatus = occurrence.runStatus ?? 'scheduled'
  const isDuration = occurrence.timeMode === 'duration'
  const isWindow = occurrence.timeMode === 'window'
  const sessionPath = `/calendar/events/${occurrence.id}/sessions/${occurrence.occurrenceDate}`

  return (
    <div className="flex flex-col">
      {!isPanel ? (
        <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-medium text-foreground">{occurrence.serviceName}</p>
            <p className="text-xs text-muted-foreground">
              {t('session.subtitle', { serviceName: occurrence.serviceName })}
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
        {occurrence.sessionIssue === 'staff_leave' ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t('schedule.issue.staffLeaveDetail', { name: staffName })}
            </AlertDescription>
          </Alert>
        ) : null}
        {occurrence.sessionIssue === 'cancelled' ? (
          <Alert variant="destructive">
            <AlertDescription>{t('schedule.issue.cancelledDetail')}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <DetailField
            label={t('schedule.eventPreview.date')}
            value={formatCalendarYmd(occurrence.occurrenceDate, i18n.language)}
          />
          <DetailField
            label={t('schedule.eventPreview.weekday')}
            value={weekdayLabel(occurrence.occurrenceDate)}
          />
          <DetailField
            label={t('schedule.eventPreview.time')}
            value={`${occurrence.startTime}–${occurrence.endTime}`}
          />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t('schedule.eventPreview.status')}
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusTag
                variant={
                  occurrence.sessionIssue ? 'rejected' : RUN_STATUS_VARIANT[runStatus]
                }
              >
                {occurrence.sessionIssue === 'staff_leave'
                  ? t('schedule.issue.staffLeaveShort')
                  : occurrence.sessionIssue === 'cancelled'
                    ? t('schedule.issue.cancelledShort')
                    : t(`sessionStatus.${runStatus}`)}
              </StatusTag>
              {occurrence.viewerCheckedIn === true ? (
                <StatusTag variant="verified">
                  {t('session.tokenStatus.checkedIn')}
                </StatusTag>
              ) : occurrence.viewerCheckedIn === false ? (
                <StatusTag variant="pending">
                  {t('session.tokenStatus.notCheckedIn')}
                </StatusTag>
              ) : null}
            </div>
          </div>
        </div>

        <SessionScheduleChangeMeta
          scheduleChanged={occurrence.scheduleChanged}
          scheduleChangeKind={occurrence.scheduleChangeKind}
          originalStartTime={occurrence.originalStartTime}
          originalEndTime={occurrence.originalEndTime}
        />

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <DetailFieldWithImage
            label={t('schedule.eventPreview.service')}
            value={occurrence.serviceName}
            imageUrl={occurrence.serviceImageUrl}
            imageAlt={occurrence.serviceName}
          />
          <DetailField
            label={t('schedule.eventPreview.timeMode')}
            value={formatTimeModeLabel(occurrence.timeMode)}
          />
          <DetailFieldWithImage
            label={t('schedule.eventPreview.staff')}
            value={staffName}
            imageUrl={occurrence.staffImageUrl}
            imageAlt={staffName}
          />
          {isWindow ? (
            <DetailField
              label={t('schedule.eventPreview.space')}
              value={occurrence.spaceName ?? '—'}
            />
          ) : null}
        </div>
        {isDuration ? (
          <div className="grid grid-cols-2 gap-3">
            <DetailFieldWithImage
              label={t('schedule.eventPreview.attendee')}
              value={occurrence.attendeeDisplayName ?? '—'}
              imageUrl={occurrence.attendeeImageUrl}
              imageAlt={occurrence.attendeeDisplayName ?? t('schedule.eventPreview.attendee')}
            />
            <DetailField
              label={t('schedule.eventPreview.email')}
              value={occurrence.attendeeEmail ?? '—'}
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

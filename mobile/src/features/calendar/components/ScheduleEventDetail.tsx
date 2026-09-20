import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  Button,
  ImagePreview,
  Muted,
  ReadOnlyField,
  StatusTag,
  type StatusTagVariant,
} from '@webonone/mobile-ui'
import { SessionScheduleChangeMeta } from '@/features/calendar/components/SessionScheduleChangeMeta'
import { formatTimeModeLabel } from '@/features/calendar/schemas/eventSchemas'
import { DAY_LABELS } from '@/features/calendar/schemas/eventSchemas'
import type { CompanyEventOccurrence, SessionRunStatus } from '@/features/calendar/types/event.types'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'
import { parseYmd } from '@/features/calendar/utils/dateYmd'

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

export function ScheduleEventDetail({
  occurrence,
  onOpenSession,
}: {
  occurrence: CompanyEventOccurrence
  onOpenSession: () => void
}) {
  const staffName = occurrence.effectiveStaffDisplayName ?? occurrence.staffDisplayName ?? '—'
  const runStatus = occurrence.runStatus ?? 'scheduled'
  const isDuration = occurrence.timeMode === 'duration'

  return (
    <View className="gap-4">
      {occurrence.sessionIssue === 'staff_leave' ? (
        <Alert variant="destructive">
          <AlertDescription>
            {staffName} is on approved leave for this session. Cancel the session or reassign another staff member.
          </AlertDescription>
        </Alert>
      ) : null}
      {occurrence.sessionIssue === 'cancelled' ? (
        <Alert variant="destructive">
          <AlertDescription>This session is cancelled and is hidden from customers.</AlertDescription>
        </Alert>
      ) : null}

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[45%] flex-1">
          <ReadOnlyField label="Date" value={formatCalendarYmd(occurrence.occurrenceDate)} />
        </View>
        <View className="min-w-[45%] flex-1">
          <ReadOnlyField label="Weekday" value={weekdayLabel(occurrence.occurrenceDate)} />
        </View>
        <View className="min-w-[45%] flex-1">
          <ReadOnlyField label="Time" value={`${occurrence.startTime}–${occurrence.endTime}`} />
        </View>
        <View className="min-w-[45%] flex-1 gap-1">
          <Muted className="text-xs uppercase tracking-wide">Status</Muted>
          <View className="flex-row flex-wrap gap-2">
            <StatusTag variant={occurrence.sessionIssue ? 'rejected' : RUN_STATUS_VARIANT[runStatus]}>
              {occurrence.sessionIssue === 'staff_leave'
                ? 'Staff on leave'
                : occurrence.sessionIssue === 'cancelled'
                  ? 'Cancelled'
                  : RUN_STATUS_LABEL[runStatus]}
            </StatusTag>
            {occurrence.viewerCheckedIn === true ? (
              <StatusTag variant="verified">Checked in</StatusTag>
            ) : occurrence.viewerCheckedIn === false ? (
              <StatusTag variant="pending">Not checked in</StatusTag>
            ) : null}
          </View>
        </View>
      </View>

      <SessionScheduleChangeMeta
        scheduleChanged={occurrence.scheduleChanged}
        scheduleChangeKind={occurrence.scheduleChangeKind}
        originalStartTime={occurrence.originalStartTime}
        originalEndTime={occurrence.originalEndTime}
      />

      <View className="gap-3 border-t border-border pt-3">
        <View className="flex-row items-center gap-2">
          <ImagePreview
            src={occurrence.serviceImageUrl}
            alt={occurrence.serviceName}
            className="h-8 w-8 rounded-md"
          />
          <View className="min-w-0 flex-1">
            <ReadOnlyField label="Service" value={occurrence.serviceName} />
          </View>
        </View>
        <ReadOnlyField label="Time mode" value={formatTimeModeLabel(occurrence.timeMode)} />
        <View className="flex-row items-center gap-2">
          <ImagePreview src={occurrence.staffImageUrl} alt={staffName} className="h-8 w-8 rounded-md" />
          <View className="min-w-0 flex-1">
            <ReadOnlyField label="Staff" value={staffName} />
          </View>
        </View>
        {occurrence.timeMode === 'window' ? (
          <ReadOnlyField label="Space" value={occurrence.spaceName ?? '—'} />
        ) : null}
        {isDuration ? (
          <>
            <ReadOnlyField label="Attendee" value={occurrence.attendeeDisplayName ?? '—'} />
            <ReadOnlyField label="Email" value={occurrence.attendeeEmail ?? '—'} />
          </>
        ) : null}
      </View>

      <Button onPress={onOpenSession}>Open session</Button>
    </View>
  )
}

export function scheduleIssueSubtitle(occurrence: CompanyEventOccurrence): {
  subtitle?: string
  issueDetail?: string
} {
  if (occurrence.sessionIssue === 'staff_leave') {
    return {
      subtitle: 'Staff on leave',
      issueDetail: `${occurrence.effectiveStaffDisplayName ?? occurrence.staffDisplayName ?? 'Staff'} is on approved leave for this session.`,
    }
  }
  if (occurrence.sessionIssue === 'cancelled') {
    return {
      subtitle: 'Cancelled',
      issueDetail: 'This session is cancelled and is hidden from customers.',
    }
  }
  return {}
}

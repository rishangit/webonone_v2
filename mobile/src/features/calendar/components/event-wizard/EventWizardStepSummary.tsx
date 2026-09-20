import { View } from 'react-native'
import { ReadOnlyField } from '@webonone/mobile-ui'
import {
  formatRecurrenceLabel,
  formatWeekdaysLabel,
  type EventWizardFormValues,
} from '@/features/calendar/schemas/eventSchemas'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'

export function EventWizardStepSummary({ values }: { values: EventWizardFormValues }) {
  const { service, attendee, startsOn, startTime, weekdays, recurrence, recurrenceUntil } = values
  const isDuration = service?.timeMode === 'duration'
  const endHint =
    service?.timeMode === 'window'
      ? `${service.startTime ?? '—'}–${service.endTime ?? '—'}`
      : `${startTime} (+${service?.durationMinutes ?? '—'} min)`
  const scheduleLabel = isDuration
    ? formatRecurrenceLabel(recurrence, { startsOn, weekdays })
    : weekdays.length > 0
      ? formatWeekdaysLabel(weekdays)
      : '—'
  const rangeLabel =
    isDuration && recurrence === 'none'
      ? startsOn
        ? formatCalendarYmd(startsOn)
        : '—'
      : startsOn && recurrenceUntil
        ? `${formatCalendarYmd(startsOn)} → ${formatCalendarYmd(recurrenceUntil)}`
        : '—'

  return (
    <View className="gap-3">
      <ReadOnlyField label="Service" value={service?.name ?? '—'} />
      <ReadOnlyField
        label="Time mode"
        value={service?.timeMode === 'window' ? 'Specific time' : 'Duration'}
      />
      {isDuration ? (
        <ReadOnlyField
          label="Attendee"
          value={
            attendee
              ? `${attendee.displayName}${attendee.email ? ` (${attendee.email})` : ''}`
              : '—'
          }
        />
      ) : null}
      <ReadOnlyField label={isDuration ? 'Schedule' : 'Weekdays'} value={scheduleLabel} />
      <ReadOnlyField
        label={isDuration && recurrence === 'none' ? 'Date' : 'Range'}
        value={rangeLabel}
      />
      <ReadOnlyField label="Time" value={endHint} />
    </View>
  )
}

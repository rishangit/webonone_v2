import {
  formatRecurrenceLabel,
  formatWeekdaysLabel,
  type EventWizardFormValues,
} from '@/features/calendar/schemas/eventSchemas'

type EventWizardStepSummaryProps = {
  values: EventWizardFormValues
}

export function EventWizardStepSummary({ values }: EventWizardStepSummaryProps) {
  const {
    service,
    staff,
    attendee,
    space,
    startsOn,
    startTime,
    weekdays,
    recurrence,
    recurrenceUntil,
  } = values
  const endHint =
    service?.timeMode === 'window'
      ? `${service.startTime ?? '—'}–${service.endTime ?? '—'}`
      : `${startTime} (+${service?.durationMinutes ?? '—'} min)`

  const isDuration = service?.timeMode === 'duration'
  const scheduleLabel = isDuration
    ? formatRecurrenceLabel(recurrence, { startsOn, weekdays })
    : weekdays.length > 0
      ? formatWeekdaysLabel(weekdays)
      : '—'
  const rangeLabel =
    isDuration && recurrence === 'none'
      ? startsOn || '—'
      : startsOn && recurrenceUntil
        ? `${startsOn} → ${recurrenceUntil}`
        : '—'

  return (
    <div className="space-y-3 text-sm">
      <SummaryRow label="Service" value={service?.name ?? '—'} />
      <SummaryRow
        label="Time mode"
        value={service?.timeMode === 'window' ? 'Specific time' : 'Duration'}
      />
      <SummaryRow label="Staff" value={staff?.displayName ?? '—'} />
      {isDuration ? (
        <SummaryRow
          label="Attendee"
          value={
            attendee
              ? `${attendee.displayName}${attendee.email ? ` (${attendee.email})` : ''}`
              : '—'
          }
        />
      ) : null}
      {service?.timeMode === 'window' ? (
        <SummaryRow label="Where" value={space?.name ?? '—'} />
      ) : null}
      <SummaryRow label={isDuration ? 'Schedule' : 'Weekdays'} value={scheduleLabel} />
      <SummaryRow label={isDuration && recurrence === 'none' ? 'Date' : 'Range'} value={rangeLabel} />
      <SummaryRow label="Time" value={endHint} />
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-border py-2 last:border-b-0">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium">{value}</dd>
    </div>
  )
}

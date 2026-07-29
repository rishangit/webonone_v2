import {
  formatWeekdaysLabel,
  type EventWizardFormValues,
} from '@/features/calendar/schemas/eventSchemas'

type EventWizardStepSummaryProps = {
  values: EventWizardFormValues
}

export function EventWizardStepSummary({ values }: EventWizardStepSummaryProps) {
  const { service, staff, attendee, startsOn, startTime, weekdays, recurrenceUntil } = values
  const endHint =
    service?.timeMode === 'window'
      ? `${service.startTime ?? '—'}–${service.endTime ?? '—'}`
      : `${startTime} (+${service?.durationMinutes ?? '—'} min)`

  return (
    <div className="space-y-3 text-sm">
      <SummaryRow label="Service" value={service?.name ?? '—'} />
      <SummaryRow
        label="Time mode"
        value={service?.timeMode === 'window' ? 'Specific time' : 'Duration'}
      />
      <SummaryRow label="Staff" value={staff?.displayName ?? '—'} />
      {service?.timeMode === 'duration' ? (
        <SummaryRow
          label="Attendee"
          value={
            attendee
              ? `${attendee.displayName}${attendee.email ? ` (${attendee.email})` : ''}`
              : '—'
          }
        />
      ) : null}
      <SummaryRow
        label="Weekdays"
        value={weekdays.length > 0 ? formatWeekdaysLabel(weekdays) : '—'}
      />
      <SummaryRow
        label="Range"
        value={startsOn && recurrenceUntil ? `${startsOn} → ${recurrenceUntil}` : '—'}
      />
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

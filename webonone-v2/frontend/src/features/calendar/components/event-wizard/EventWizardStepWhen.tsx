import { Checkbox, DatePicker, FormField, Input, Label } from '@webonone/ui-kit'
import {
  formatWeekdaysLabel,
  staffHoursForWeekday,
  staffWorkingWeekdays,
  type EventServiceOption,
} from '@/features/calendar/schemas/eventSchemas'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type EventWizardStepWhenProps = {
  service: EventServiceOption
  staff: CompanyStaff
  startsOn: string
  startTime: string
  weekdays: number[]
  recurrenceUntil: string
  onChange: (patch: {
    startsOn?: string
    startTime?: string
    weekdays?: number[]
    recurrenceUntil?: string
  }) => void
  errors: Record<string, string>
}

function toDate(ymd: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined
  return new Date(`${ymd}T12:00:00`)
}

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function EventWizardStepWhen({
  service,
  staff,
  startsOn,
  startTime,
  weekdays,
  recurrenceUntil,
  onChange,
  errors,
}: EventWizardStepWhenProps) {
  const workingDays = staffWorkingWeekdays(staff.schedule)
  const selectedSet = new Set(weekdays)

  function toggleWeekday(day: number, checked: boolean) {
    const next = checked
      ? [...new Set([...weekdays, day])].sort((a, b) => a - b)
      : weekdays.filter((d) => d !== day)
    onChange({ weekdays: next })
  }

  const hoursHints = weekdays
    .map((day) => {
      const hours = staffHoursForWeekday(staff.schedule, day)
      if (!hours) return null
      return `${DAY_LABELS[day]?.slice(0, 3)} ${hours.start}–${hours.end}`
    })
    .filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Working days <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Choose which of this staff member&apos;s working weekdays the event repeats on.
        </p>
        {workingDays.length === 0 ? (
          <p className="text-sm text-destructive">This staff member has no working days set.</p>
        ) : (
          <div className="space-y-2 rounded-md border border-border p-3">
            {workingDays.map((day) => {
              const hours = staffHoursForWeekday(staff.schedule, day)
              const id = `event-weekday-${day}`
              return (
                <label key={day} htmlFor={id} className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    id={id}
                    checked={selectedSet.has(day)}
                    onCheckedChange={(value) => toggleWeekday(day, value === true)}
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{DAY_LABELS[day]}</span>
                    {hours ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {hours.start}–{hours.end}
                      </span>
                    ) : null}
                  </span>
                </label>
              )
            })}
          </div>
        )}
        {errors.weekdays ? <p className="text-sm text-destructive">{errors.weekdays}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="From" htmlFor="event-starts-on" required error={errors.startsOn}>
          <DatePicker
            id="event-starts-on"
            value={toDate(startsOn)}
            onChange={(date) => onChange({ startsOn: date ? toYmd(date) : '' })}
            withIcon
            placeholder="Series start"
          />
        </FormField>
        <FormField
          label="Until"
          htmlFor="event-recurrence-until"
          required
          error={errors.recurrenceUntil}
        >
          <DatePicker
            id="event-recurrence-until"
            value={toDate(recurrenceUntil)}
            onChange={(date) => onChange({ recurrenceUntil: date ? toYmd(date) : '' })}
            withIcon
            placeholder="Series end"
          />
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground">
        Occurrences run on {weekdays.length > 0 ? formatWeekdaysLabel(weekdays) : 'selected days'}{' '}
        from the start date through the end date.
      </p>

      {service.timeMode === 'window' ? (
        <div className="rounded-md border border-border p-3 text-sm">
          <p className="font-medium">Service time</p>
          <p className="text-muted-foreground">
            {service.startTime ?? '—'}–{service.endTime ?? '—'}
          </p>
        </div>
      ) : (
        <FormField label="Start time" htmlFor="event-start-time" required error={errors.startTime}>
          <Input
            id="event-start-time"
            type="time"
            value={startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
          {hoursHints.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Must fit staff hours on every selected day: {hoursHints.join(' · ')}
            </p>
          ) : null}
        </FormField>
      )}
    </div>
  )
}

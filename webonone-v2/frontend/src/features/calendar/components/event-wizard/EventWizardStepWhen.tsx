import {
  Checkbox,
  DatePicker,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import {
  dayOfMonthOfYmd,
  formatWeekdaysLabel,
  staffHoursForDate,
  staffHoursForWeekday,
  staffWorkingWeekdays,
  type DurationRepeatFrequency,
  type EventServiceOption,
} from '@/features/calendar/schemas/eventSchemas'
import type { EventRecurrence } from '@/features/calendar/types/event.types'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type EventWizardStepWhenProps = {
  service: EventServiceOption
  staff: CompanyStaff
  startsOn: string
  startTime: string
  weekdays: number[]
  recurrence: EventRecurrence
  recurrenceUntil: string
  onChange: (patch: {
    startsOn?: string
    startTime?: string
    weekdays?: number[]
    recurrence?: EventRecurrence
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

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function DurationWhenStep({
  service,
  staff,
  startsOn,
  startTime,
  recurrence,
  recurrenceUntil,
  onChange,
  errors,
}: EventWizardStepWhenProps) {
  const repeating = recurrence !== 'none'
  const dayOfMonth = startsOn ? dayOfMonthOfYmd(startsOn) : null
  const hoursHint = startsOn ? staffHoursForDate(staff.schedule, startsOn) : null

  function setRepeat(enabled: boolean) {
    if (!enabled) {
      onChange({
        recurrence: 'none',
        recurrenceUntil: startsOn || '',
      })
      return
    }
    onChange({
      recurrence: recurrence === 'none' ? 'weekly' : recurrence,
      recurrenceUntil: recurrenceUntil || startsOn || '',
    })
  }

  function setFrequency(value: DurationRepeatFrequency) {
    onChange({ recurrence: value })
  }

  return (
    <div className="space-y-4">
      <FormField label="Date" htmlFor="event-starts-on" required error={errors.startsOn}>
        <DatePicker
          id="event-starts-on"
          value={toDate(startsOn)}
          onChange={(date) => {
            const ymd = date ? toYmd(date) : ''
            onChange({
              startsOn: ymd,
              ...(recurrence === 'none' ? { recurrenceUntil: ymd } : {}),
            })
          }}
          withIcon
          placeholder="Select date"
        />
      </FormField>

      <FormField label="Start time" htmlFor="event-start-time" required error={errors.startTime}>
        <Input
          id="event-start-time"
          type="time"
          value={startTime}
          onChange={(e) => onChange({ startTime: e.target.value })}
        />
        {hoursHint ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Must fit staff hours on this day: {hoursHint.start}–{hoursHint.end}
            {service.durationMinutes != null
              ? ` · ends after ${service.durationMinutes} min`
              : null}
          </p>
        ) : startsOn ? (
          <p className="mt-1 text-xs text-destructive">Staff is not working on this date.</p>
        ) : null}
      </FormField>

      <label htmlFor="event-repeat" className="flex cursor-pointer items-center gap-3">
        <Checkbox
          id="event-repeat"
          checked={repeating}
          onCheckedChange={(value) => setRepeat(value === true)}
        />
        <span className="text-sm font-medium">Repeat this event</span>
      </label>

      {repeating ? (
        <div className="space-y-4 rounded-md border border-border p-3">
          <FormField label="Frequency" htmlFor="event-frequency" required error={errors.recurrence}>
            <Select
              value={recurrence}
              onValueChange={(value) => setFrequency(value as DurationRepeatFrequency)}
            >
              <SelectTrigger id="event-frequency" className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Every week</SelectItem>
                <SelectItem value="biweekly">Every two weeks</SelectItem>
                <SelectItem value="monthly_first_week">Every month (first week)</SelectItem>
                <SelectItem value="monthly_by_date">
                  {dayOfMonth != null
                    ? `Every month on the ${ordinal(dayOfMonth)}`
                    : 'Every month on day of month'}
                </SelectItem>
              </SelectContent>
            </Select>
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
          <p className="text-xs text-muted-foreground">
            Same start time on each occurrence through the end date.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function WindowWhenStep({
  service,
  staff,
  startsOn,
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

      <div className="rounded-md border border-border p-3 text-sm">
        <p className="font-medium">Service time</p>
        <p className="text-muted-foreground">
          {service.startTime ?? '—'}–{service.endTime ?? '—'}
        </p>
      </div>
    </div>
  )
}

export function EventWizardStepWhen(props: EventWizardStepWhenProps) {
  if (props.service.timeMode === 'duration') {
    return <DurationWhenStep {...props} />
  }
  return <WindowWhenStep {...props} />
}

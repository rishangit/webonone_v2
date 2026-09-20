import { View } from 'react-native'
import {
  Body,
  Checkbox,
  DateField,
  FormField,
  Muted,
  NativeSelect,
  TextField,
} from '@webonone/mobile-ui'
import {
  DAY_LABELS,
  formatWeekdaysLabel,
  type DurationRepeatFrequency,
  type EventServiceOption,
} from '@/features/calendar/schemas/eventSchemas'
import type { EventRecurrence } from '@/features/calendar/types/event.types'
import { dayOfMonthOfYmd, parseYmd, toYmd } from '@/features/calendar/utils/dateYmd'

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const

type EventWizardStepWhenProps = {
  service: EventServiceOption
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
  startsOn,
  startTime,
  recurrence,
  recurrenceUntil,
  onChange,
  errors,
}: EventWizardStepWhenProps) {
  const repeating = recurrence !== 'none'
  const dayOfMonth = startsOn ? dayOfMonthOfYmd(startsOn) : null

  function setRepeat(enabled: boolean) {
    if (!enabled) {
      onChange({ recurrence: 'none', recurrenceUntil: startsOn || '' })
      return
    }
    onChange({
      recurrence: recurrence === 'none' ? 'weekly' : recurrence,
      recurrenceUntil: recurrenceUntil || startsOn || '',
    })
  }

  return (
    <View className="gap-4">
      <DateField
        label="Date"
        required
        value={parseYmd(startsOn)}
        onChange={(date) => {
          const ymd = date ? toYmd(date) : ''
          onChange({
            startsOn: ymd,
            ...(recurrence === 'none' ? { recurrenceUntil: ymd } : {}),
          })
        }}
        error={errors.startsOn}
        placeholder="Select date"
      />
      <TextField
        label="Start time"
        required
        value={startTime}
        onChangeText={(value) => onChange({ startTime: value })}
        placeholder="09:00"
        error={errors.startTime}
        hint={service.durationMinutes != null ? `Service duration: ${service.durationMinutes} min` : undefined}
      />
      <Checkbox checked={repeating} onCheckedChange={setRepeat} label="Repeat this event" />
      {repeating ? (
        <View className="gap-4 rounded-md border border-border p-3">
          <NativeSelect
            label="Frequency"
            required
            value={recurrence}
            onValueChange={(value) => onChange({ recurrence: value as DurationRepeatFrequency })}
            allowEmpty={false}
            error={errors.recurrence}
            options={[
              { value: 'weekly', label: 'Every week' },
              { value: 'biweekly', label: 'Every two weeks' },
              { value: 'monthly_first_week', label: 'Every month (first week)' },
              {
                value: 'monthly_by_date',
                label:
                  dayOfMonth != null
                    ? `Every month on the ${ordinal(dayOfMonth)}`
                    : 'Every month on day of month',
              },
            ]}
          />
          <DateField
            label="Until"
            required
            value={parseYmd(recurrenceUntil)}
            onChange={(date) => onChange({ recurrenceUntil: date ? toYmd(date) : '' })}
            error={errors.recurrenceUntil}
            placeholder="Series end"
          />
          <Muted>Same start time on each occurrence through the end date.</Muted>
        </View>
      ) : null}
    </View>
  )
}

function WindowWhenStep({
  service,
  startsOn,
  weekdays,
  recurrenceUntil,
  onChange,
  errors,
}: EventWizardStepWhenProps) {
  const selectedSet = new Set(weekdays)

  function toggleWeekday(day: number, checked: boolean) {
    const next = checked
      ? [...new Set([...weekdays, day])].sort((a, b) => a - b)
      : weekdays.filter((d) => d !== day)
    onChange({ weekdays: next })
  }

  return (
    <View className="gap-4">
      <FormField label="Weekdays" required error={errors.weekdays}>
        <Muted>Choose which days of the week this event repeats on.</Muted>
        <View className="gap-2 rounded-md border border-border p-3">
          {ALL_WEEKDAYS.map((day) => (
            <Checkbox
              key={day}
              checked={selectedSet.has(day)}
              onCheckedChange={(checked) => toggleWeekday(day, checked)}
              label={DAY_LABELS[day]}
            />
          ))}
        </View>
      </FormField>
      <DateField
        label="From"
        required
        value={parseYmd(startsOn)}
        onChange={(date) => onChange({ startsOn: date ? toYmd(date) : '' })}
        error={errors.startsOn}
        placeholder="Series start"
      />
      <DateField
        label="Until"
        required
        value={parseYmd(recurrenceUntil)}
        onChange={(date) => onChange({ recurrenceUntil: date ? toYmd(date) : '' })}
        error={errors.recurrenceUntil}
        placeholder="Series end"
      />
      <Muted>
        Occurrences run on {weekdays.length > 0 ? formatWeekdaysLabel(weekdays) : 'selected days'} from
        the start date through the end date.
      </Muted>
      <View className="gap-1 rounded-md border border-border p-3">
        <Body className="font-medium">Service time</Body>
        <Muted>
          {service.startTime ?? '—'}–{service.endTime ?? '—'}
        </Muted>
      </View>
    </View>
  )
}

export function EventWizardStepWhen(props: EventWizardStepWhenProps) {
  if (props.service.timeMode === 'duration') {
    return <DurationWhenStep {...props} />
  }
  return <WindowWhenStep {...props} />
}

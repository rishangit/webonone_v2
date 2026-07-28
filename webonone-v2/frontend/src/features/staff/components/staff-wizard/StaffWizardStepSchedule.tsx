import { FormField, Input, Switch } from '@webonone/ui-kit'
import {
  DAY_LABELS,
  type StaffWizardFormValues,
} from '@/features/staff/schemas/staffSchemas'
import type { StaffScheduleDay } from '@/features/staff/types/staff.types'

type StaffWizardStepScheduleProps = {
  values: StaffWizardFormValues
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onChange: (schedule: StaffScheduleDay[]) => void
}

export function StaffWizardStepSchedule({
  values,
  fieldErrors,
  isSubmitting,
  onChange,
}: StaffWizardStepScheduleProps) {
  function patchDay(dayOfWeek: number, patch: Partial<StaffScheduleDay>) {
    onChange(
      values.schedule.map((day) =>
        day.day_of_week === dayOfWeek
          ? {
              ...day,
              ...patch,
              start_time:
                patch.is_working === false
                  ? null
                  : (patch.start_time !== undefined ? patch.start_time : day.start_time),
              end_time:
                patch.is_working === false
                  ? null
                  : (patch.end_time !== undefined ? patch.end_time : day.end_time),
            }
          : day,
      ),
    )
  }

  return (
    <div className="space-y-4">
      {fieldErrors.schedule ? (
        <p className="text-sm text-destructive">{fieldErrors.schedule}</p>
      ) : null}
      <div className="space-y-3">
        {values.schedule.map((day) => {
          const label = DAY_LABELS[day.day_of_week] ?? `Day ${day.day_of_week}`
          const startError = fieldErrors[`schedule.${day.day_of_week}.start_time`]
          const endError = fieldErrors[`schedule.${day.day_of_week}.end_time`]
          return (
            <div
              key={day.day_of_week}
              className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Working</span>
                  <Switch
                    checked={day.is_working}
                    disabled={isSubmitting}
                    onCheckedChange={(checked) =>
                      patchDay(day.day_of_week, {
                        is_working: checked,
                        start_time: checked ? (day.start_time ?? '09:00') : null,
                        end_time: checked ? (day.end_time ?? '17:00') : null,
                      })
                    }
                    aria-label={`${label} working day`}
                  />
                </div>
              </div>
              {day.is_working ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Start"
                    htmlFor={`staff-schedule-start-${day.day_of_week}`}
                    required
                    error={startError}
                  >
                    <Input
                      id={`staff-schedule-start-${day.day_of_week}`}
                      type="time"
                      value={day.start_time ?? ''}
                      disabled={isSubmitting}
                      onChange={(e) =>
                        patchDay(day.day_of_week, { start_time: e.target.value || null })
                      }
                      className="w-full"
                    />
                  </FormField>
                  <FormField
                    label="End"
                    htmlFor={`staff-schedule-end-${day.day_of_week}`}
                    required
                    error={endError}
                  >
                    <Input
                      id={`staff-schedule-end-${day.day_of_week}`}
                      type="time"
                      value={day.end_time ?? ''}
                      disabled={isSubmitting}
                      onChange={(e) =>
                        patchDay(day.day_of_week, { end_time: e.target.value || null })
                      }
                      className="w-full"
                    />
                  </FormField>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

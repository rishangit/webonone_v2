import { View } from 'react-native'
import { Body, FormField, Muted, Switch, TextField } from '@webonone/mobile-ui'
import {
  DAY_LABELS,
  type StaffWizardFormValues,
} from '@/features/staff/schemas/staffSchemas'
import type { StaffScheduleDay } from '@/features/staff/types/staff.types'

type StaffWizardStepScheduleProps = {
  values: StaffWizardFormValues
  fieldErrors: Record<string, string>
  disabled?: boolean
  onChange: (schedule: StaffScheduleDay[]) => void
}

export function StaffWizardStepSchedule({
  values,
  fieldErrors,
  disabled,
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
                  : patch.start_time !== undefined
                    ? patch.start_time
                    : day.start_time,
              end_time:
                patch.is_working === false
                  ? null
                  : patch.end_time !== undefined
                    ? patch.end_time
                    : day.end_time,
            }
          : day,
      ),
    )
  }

  return (
    <View className="gap-4">
      {fieldErrors.schedule ? <Body className="text-destructive">{fieldErrors.schedule}</Body> : null}
      {values.schedule.map((day) => {
        const label = DAY_LABELS[day.day_of_week] ?? `Day ${day.day_of_week}`
        const startError = fieldErrors[`schedule.${day.day_of_week}.start_time`]
        const endError = fieldErrors[`schedule.${day.day_of_week}.end_time`]
        return (
          <View
            key={day.day_of_week}
            className="gap-3 rounded-lg border border-border bg-card p-3"
          >
            <View className="flex-row items-center justify-between gap-3">
              <Body className="font-medium">{label}</Body>
              <Switch
                checked={day.is_working}
                disabled={disabled}
                label="Working"
                onCheckedChange={(checked) =>
                  patchDay(day.day_of_week, {
                    is_working: checked,
                    start_time: checked ? (day.start_time ?? '09:00') : null,
                    end_time: checked ? (day.end_time ?? '17:00') : null,
                  })
                }
              />
            </View>
            {day.is_working ? (
              <View className="gap-3">
                <FormField label="Start" required error={startError}>
                  <TextField
                    value={day.start_time ?? ''}
                    onChangeText={(value) => patchDay(day.day_of_week, { start_time: value })}
                    editable={!disabled}
                    placeholder="09:00"
                  />
                </FormField>
                <FormField label="End" required error={endError}>
                  <TextField
                    value={day.end_time ?? ''}
                    onChangeText={(value) => patchDay(day.day_of_week, { end_time: value })}
                    editable={!disabled}
                    placeholder="17:00"
                  />
                </FormField>
              </View>
            ) : null}
          </View>
        )
      })}
      <Muted className="text-xs">Use 24-hour HH:mm times.</Muted>
    </View>
  )
}

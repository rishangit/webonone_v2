import {
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import type {
  ServiceTimeMode,
  ServiceWizardFormValues,
} from '@/features/company-catalog/schemas/serviceSchemas'

interface ServiceWizardStepTimeProps {
  values: ServiceWizardFormValues
  fieldErrors: Partial<Record<keyof ServiceWizardFormValues, string>>
  isSubmitting: boolean
  onChange: (patch: Partial<ServiceWizardFormValues>) => void
}

export function ServiceWizardStepTime({
  values,
  fieldErrors,
  isSubmitting,
  onChange,
}: ServiceWizardStepTimeProps) {
  return (
    <div className="space-y-4">
      <FormField
        label="Time"
        htmlFor="company-service-wizard-time-mode"
        required
        error={fieldErrors.time_mode}
      >
        <Select
          value={values.time_mode}
          onValueChange={(v) => onChange({ time_mode: v as ServiceTimeMode })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="company-service-wizard-time-mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="window">Specific time</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {values.time_mode === 'duration' ? (
        <FormField
          label="Duration (minutes)"
          htmlFor="company-service-wizard-duration"
          required
          error={fieldErrors.duration_minutes}
        >
          <Input
            id="company-service-wizard-duration"
            type="number"
            min={1}
            step={1}
            value={values.duration_minutes}
            onChange={(e) => onChange({ duration_minutes: e.target.value })}
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Start time"
            htmlFor="company-service-wizard-start-time"
            required
            error={fieldErrors.start_time}
          >
            <Input
              id="company-service-wizard-start-time"
              type="time"
              value={values.start_time}
              onChange={(e) => onChange({ start_time: e.target.value })}
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>
          <FormField
            label="End time"
            htmlFor="company-service-wizard-end-time"
            required
            error={fieldErrors.end_time}
          >
            <Input
              id="company-service-wizard-end-time"
              type="time"
              value={values.end_time}
              onChange={(e) => onChange({ end_time: e.target.value })}
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>
        </div>
      )}
    </div>
  )
}

import { FormField, Input } from '@webonone/ui-kit'
import type { ThemeFormValues } from '../../schemas/themeFormSchema'

interface ThemeWizardStepBasicsProps {
  values: ThemeFormValues
  fieldErrors: Partial<Record<keyof ThemeFormValues, string>>
  isSubmitting?: boolean
  onChange: (patch: Partial<ThemeFormValues>) => void
}

export function ThemeWizardStepBasics({
  values,
  fieldErrors,
  isSubmitting = false,
  onChange,
}: ThemeWizardStepBasicsProps) {
  return (
    <div className="space-y-4">
      <FormField label="Theme name" htmlFor="theme-wizard-name" required error={fieldErrors.name}>
        <Input
          id="theme-wizard-name"
          value={values.name}
          disabled={isSubmitting}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </FormField>
    </div>
  )
}

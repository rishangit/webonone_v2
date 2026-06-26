import {
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@webonone/ui-kit'
import {
  COMPANY_SIZE_OPTIONS,
  type RegisterCompanyFormValues,
} from '../../schemas/companySchemas'

interface RegisterWizardStepBasicsProps {
  values: RegisterCompanyFormValues
  fieldErrors: Partial<Record<keyof RegisterCompanyFormValues, string>>
  isSubmitting: boolean
  onChange: (patch: Partial<RegisterCompanyFormValues>) => void
}

export function RegisterWizardStepBasics({
  values,
  fieldErrors,
  isSubmitting,
  onChange,
}: RegisterWizardStepBasicsProps) {
  return (
    <div className="space-y-4">
      <FormField label="Company name" htmlFor="register-company-name" required error={fieldErrors.name}>
        <Input
          id="register-company-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Your company name"
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label="Company description"
        htmlFor="register-company-description"
        required
        error={fieldErrors.description}
      >
        <Textarea
          id="register-company-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What does your company do?"
          disabled={isSubmitting}
          rows={4}
          className="w-full resize-none"
        />
      </FormField>

      <FormField label="Company size" htmlFor="register-company-size" required error={fieldErrors.companySize}>
        <Select
          value={values.companySize || undefined}
          onValueChange={(companySize) =>
            onChange({ companySize: companySize as RegisterCompanyFormValues['companySize'] })
          }
          disabled={isSubmitting}
        >
          <SelectTrigger id="register-company-size" className="w-full">
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            {COMPANY_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size}>
                {size} employees
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  )
}

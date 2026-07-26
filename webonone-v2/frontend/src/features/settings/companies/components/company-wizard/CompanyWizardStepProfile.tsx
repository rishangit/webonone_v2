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
  type CompanyWizardFormValues,
} from '@/features/settings/basic/schemas/companySchemas'

interface CompanyWizardStepProfileProps {
  values: CompanyWizardFormValues
  fieldErrors: Partial<Record<keyof CompanyWizardFormValues, string>>
  isSubmitting: boolean
  /** Edit mode requires description + size. */
  requireAll?: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
}

export function CompanyWizardStepProfile({
  values,
  fieldErrors,
  isSubmitting,
  requireAll = false,
  onChange,
}: CompanyWizardStepProfileProps) {
  return (
    <div className="space-y-4">
      <FormField label="Company name" htmlFor="company-wizard-name" required error={fieldErrors.name}>
        <Input
          id="company-wizard-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Your company name"
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="company-wizard-description"
        required={requireAll}
        error={fieldErrors.description}
      >
        <Textarea
          id="company-wizard-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={
            requireAll
              ? 'What does your company do?'
              : 'What does your company do? (optional — you can finish this later)'
          }
          disabled={isSubmitting}
          rows={4}
          className="w-full resize-none"
        />
      </FormField>

      <FormField
        label="Company size"
        htmlFor="company-wizard-size"
        required={requireAll}
        error={fieldErrors.companySize}
      >
        <Select
          value={values.companySize || undefined}
          onValueChange={(companySize) =>
            onChange({ companySize: companySize as CompanyWizardFormValues['companySize'] })
          }
          disabled={isSubmitting}
        >
          <SelectTrigger id="company-wizard-size" className="w-full">
            <SelectValue
              placeholder={requireAll ? 'Select company size' : 'Select company size (optional)'}
            />
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

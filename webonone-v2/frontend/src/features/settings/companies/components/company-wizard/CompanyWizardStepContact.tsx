import { FormField, Input, PhoneInput, type PhoneCountry } from '@webonone/ui-kit'
import type { CompanyWizardFormValues } from '@/features/settings/basic/schemas/companySchemas'

interface CompanyWizardStepContactProps {
  values: CompanyWizardFormValues
  fieldErrors: Partial<Record<keyof CompanyWizardFormValues | 'contactPhone', string>>
  isSubmitting: boolean
  requireAll?: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
}

export function CompanyWizardStepContact({
  values,
  fieldErrors,
  isSubmitting,
  requireAll = false,
  onChange,
}: CompanyWizardStepContactProps) {
  return (
    <div className="space-y-4">
      <FormField
        label="Contact email"
        htmlFor="company-wizard-email"
        required={requireAll}
        error={fieldErrors.contactEmail}
      >
        <Input
          id="company-wizard-email"
          type="email"
          value={values.contactEmail}
          onChange={(e) => onChange({ contactEmail: e.target.value })}
          placeholder="contact@example.com"
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label="Contact phone"
        htmlFor="company-wizard-phone"
        required={requireAll}
        error={fieldErrors.contactPhone}
      >
        <PhoneInput
          id="company-wizard-phone"
          country={values.phoneCountry}
          value={values.phoneNational}
          onCountryChange={(country: PhoneCountry) => onChange({ phoneCountry: country.iso2 })}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ phoneNational: e.target.value })
          }
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.contactPhone)}
        />
      </FormField>
    </div>
  )
}

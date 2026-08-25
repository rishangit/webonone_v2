import { CountrySelect, FormField, Input } from '@webonone/ui-kit'
import type { CompanyWizardFormValues } from '@/features/settings/basic/schemas/companySchemas'

interface CompanyWizardStepAddressProps {
  values: CompanyWizardFormValues
  fieldErrors: Partial<Record<keyof CompanyWizardFormValues, string>>
  isSubmitting: boolean
  requireAll?: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
}

export function CompanyWizardStepAddress({
  values,
  fieldErrors,
  isSubmitting,
  requireAll = false,
  onChange,
}: CompanyWizardStepAddressProps) {
  return (
    <div className="space-y-4">
      <FormField
        label="Address line 1"
        htmlFor="company-wizard-line1"
        required={requireAll}
        error={fieldErrors.addressLine1}
      >
        <Input
          id="company-wizard-line1"
          value={values.addressLine1}
          onChange={(e) => onChange({ addressLine1: e.target.value })}
          disabled={isSubmitting}
        />
      </FormField>
      <FormField
        label="Address line 2"
        htmlFor="company-wizard-line2"
        error={fieldErrors.addressLine2}
      >
        <Input
          id="company-wizard-line2"
          value={values.addressLine2}
          onChange={(e) => onChange({ addressLine2: e.target.value })}
          disabled={isSubmitting}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="City"
          htmlFor="company-wizard-city"
          required={requireAll}
          error={fieldErrors.city}
        >
          <Input
            id="company-wizard-city"
            value={values.city}
            onChange={(e) => onChange({ city: e.target.value })}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField
          label="State / region"
          htmlFor="company-wizard-state"
          error={fieldErrors.stateRegion}
        >
          <Input
            id="company-wizard-state"
            value={values.stateRegion}
            onChange={(e) => onChange({ stateRegion: e.target.value })}
            disabled={isSubmitting}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Postal code"
          htmlFor="company-wizard-postal"
          error={fieldErrors.postalCode}
        >
          <Input
            id="company-wizard-postal"
            value={values.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField
          label="Country"
          htmlFor="company-wizard-country"
          required={requireAll}
          error={fieldErrors.country}
        >
          <CountrySelect
            id="company-wizard-country"
            value={values.country}
            onValueChange={(country) => onChange({ country: country.iso2 })}
            disabled={isSubmitting}
            invalid={Boolean(fieldErrors.country)}
            placeholder="Select country"
          />
        </FormField>
      </div>
    </div>
  )
}

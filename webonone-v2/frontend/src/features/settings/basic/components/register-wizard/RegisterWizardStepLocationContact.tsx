import { FormField, Input } from '@webonone/ui-kit'
import type { RegisterCompanyFormValues } from '../../schemas/companySchemas'

interface RegisterWizardStepLocationContactProps {
  values: RegisterCompanyFormValues
  fieldErrors: Partial<Record<keyof RegisterCompanyFormValues, string>>
  isSubmitting: boolean
  onChange: (patch: Partial<RegisterCompanyFormValues>) => void
}

export function RegisterWizardStepLocationContact({
  values,
  fieldErrors,
  isSubmitting,
  onChange,
}: RegisterWizardStepLocationContactProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Location</h3>
        <FormField label="Address line 1" htmlFor="register-address-line1" required error={fieldErrors.addressLine1}>
          <Input
            id="register-address-line1"
            value={values.addressLine1}
            onChange={(e) => onChange({ addressLine1: e.target.value })}
            placeholder="Street address"
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>

        <FormField label="Address line 2" htmlFor="register-address-line2" error={fieldErrors.addressLine2}>
          <Input
            id="register-address-line2"
            value={values.addressLine2}
            onChange={(e) => onChange({ addressLine2: e.target.value })}
            placeholder="Suite, unit, etc. (optional)"
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="City" htmlFor="register-city" required error={fieldErrors.city}>
            <Input
              id="register-city"
              value={values.city}
              onChange={(e) => onChange({ city: e.target.value })}
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>

          <FormField label="State / region" htmlFor="register-state" required error={fieldErrors.stateRegion}>
            <Input
              id="register-state"
              value={values.stateRegion}
              onChange={(e) => onChange({ stateRegion: e.target.value })}
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Postal code" htmlFor="register-postal" required error={fieldErrors.postalCode}>
            <Input
              id="register-postal"
              value={values.postalCode}
              onChange={(e) => onChange({ postalCode: e.target.value })}
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>

          <FormField label="Country" htmlFor="register-country" required error={fieldErrors.country}>
            <Input
              id="register-country"
              value={values.country}
              onChange={(e) => onChange({ country: e.target.value })}
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Contact</h3>
        <FormField label="Contact email" htmlFor="register-contact-email" required error={fieldErrors.contactEmail}>
          <Input
            id="register-contact-email"
            type="email"
            value={values.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            placeholder="contact@company.com"
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>

        <FormField label="Contact phone" htmlFor="register-contact-phone" required error={fieldErrors.contactPhone}>
          <Input
            id="register-contact-phone"
            type="tel"
            value={values.contactPhone}
            onChange={(e) => onChange({ contactPhone: e.target.value })}
            placeholder="+1 234 567 8901"
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>
      </div>
    </div>
  )
}

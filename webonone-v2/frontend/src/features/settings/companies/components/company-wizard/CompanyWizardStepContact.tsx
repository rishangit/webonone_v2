import { useTranslation } from 'react-i18next'
import { FormField, Input, PhoneInput, SelectUser, type PhoneCountry, type SelectUserValue } from '@webonone/ui-kit'
import type { CompanyWizardFormValues } from '@/features/settings/basic/schemas/companySchemas'

interface CompanyWizardStepContactProps {
  values: CompanyWizardFormValues
  fieldErrors: Partial<Record<keyof CompanyWizardFormValues | 'contactPhone' | 'contactPerson', string>>
  isSubmitting: boolean
  requireAll?: boolean
  onChange: (patch: Partial<CompanyWizardFormValues>) => void
  onOpenContactPersonPicker: () => void
}

export function CompanyWizardStepContact({
  values,
  fieldErrors,
  isSubmitting,
  requireAll = false,
  onChange,
  onOpenContactPersonPicker,
}: CompanyWizardStepContactProps) {
  const { t } = useTranslation('settings')

  const selectedContactPerson: SelectUserValue | null = values.contactPerson
    ? {
        id: values.contactPerson.id,
        displayName: values.contactPerson.displayName,
        email: values.contactPerson.email ?? '',
        avatarUrl: values.contactPerson.avatarUrl,
      }
    : null

  return (
    <div className="space-y-4">
      <FormField
        label={t('companyCards.contact.contactPerson')}
        htmlFor="company-wizard-contact-person"
        required
        error={fieldErrors.contactPerson}
      >
        <SelectUser
          id="company-wizard-contact-person"
          selectedUser={selectedContactPerson}
          placeholder={t('companyCards.contact.contactPersonPlaceholder')}
          disabled={isSubmitting}
          onClick={onOpenContactPersonPicker}
        />
      </FormField>

      <FormField
        label={t('companyCards.contact.contactEmail')}
        htmlFor="company-wizard-email"
        required={requireAll}
        error={fieldErrors.contactEmail}
      >
        <Input
          id="company-wizard-email"
          type="email"
          value={values.contactEmail}
          onChange={(e) => onChange({ contactEmail: e.target.value })}
          placeholder={t('companyWizard.fields.contactEmailPlaceholder')}
          disabled={isSubmitting}
          className="w-full"
        />
      </FormField>

      <FormField
        label={t('companyCards.contact.contactPhone')}
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

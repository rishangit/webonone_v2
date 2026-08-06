import { Globe, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormField, Input, InputGroup, InputGroupIcon } from '@webonone/ui-kit'
import type { ProfileFormValues } from '../../schemas/profileSchemas'

interface ProfileWizardStepAddressProps {
  values: ProfileFormValues
  fieldErrors: Partial<Record<keyof ProfileFormValues, string>>
  isSubmitting: boolean
  onChange: (patch: Partial<ProfileFormValues>) => void
}

export function ProfileWizardStepAddress({
  values,
  fieldErrors,
  isSubmitting,
  onChange,
}: ProfileWizardStepAddressProps) {
  const { t } = useTranslation('profile')

  return (
    <div className="space-y-4">
      <FormField
        label={t('addressLine1')}
        htmlFor="profile-wizard-line1"
        error={fieldErrors.addressLine1 ? t(fieldErrors.addressLine1) : undefined}
      >
        <InputGroup>
          <InputGroupIcon icon={MapPin} />
          <Input
            id="profile-wizard-line1"
            inGroup
            autoComplete="address-line1"
            value={values.addressLine1 ?? ''}
            onChange={(e) => onChange({ addressLine1: e.target.value || null })}
            disabled={isSubmitting}
          />
        </InputGroup>
      </FormField>
      <FormField
        label={t('addressLine2')}
        htmlFor="profile-wizard-line2"
        error={fieldErrors.addressLine2 ? t(fieldErrors.addressLine2) : undefined}
      >
        <InputGroup>
          <InputGroupIcon icon={MapPin} />
          <Input
            id="profile-wizard-line2"
            inGroup
            autoComplete="address-line2"
            value={values.addressLine2 ?? ''}
            onChange={(e) => onChange({ addressLine2: e.target.value || null })}
            disabled={isSubmitting}
          />
        </InputGroup>
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={t('city')}
          htmlFor="profile-wizard-city"
          error={fieldErrors.city ? t(fieldErrors.city) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={MapPin} />
            <Input
              id="profile-wizard-city"
              inGroup
              autoComplete="address-level2"
              value={values.city ?? ''}
              onChange={(e) => onChange({ city: e.target.value || null })}
              disabled={isSubmitting}
            />
          </InputGroup>
        </FormField>
        <FormField
          label={t('stateRegion')}
          htmlFor="profile-wizard-state"
          error={fieldErrors.stateRegion ? t(fieldErrors.stateRegion) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={MapPin} />
            <Input
              id="profile-wizard-state"
              inGroup
              autoComplete="address-level1"
              value={values.stateRegion ?? ''}
              onChange={(e) => onChange({ stateRegion: e.target.value || null })}
              disabled={isSubmitting}
            />
          </InputGroup>
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={t('postalCode')}
          htmlFor="profile-wizard-postal"
          error={fieldErrors.postalCode ? t(fieldErrors.postalCode) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={MapPin} />
            <Input
              id="profile-wizard-postal"
              inGroup
              autoComplete="postal-code"
              value={values.postalCode ?? ''}
              onChange={(e) => onChange({ postalCode: e.target.value || null })}
              disabled={isSubmitting}
            />
          </InputGroup>
        </FormField>
        <FormField
          label={t('countryCode')}
          htmlFor="profile-wizard-country"
          error={fieldErrors.country ? t(fieldErrors.country) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={Globe} />
            <Input
              id="profile-wizard-country"
              inGroup
              autoComplete="country"
              placeholder="US"
              maxLength={2}
              value={values.country ?? ''}
              onChange={(e) => onChange({ country: e.target.value.toUpperCase() })}
              disabled={isSubmitting}
            />
          </InputGroup>
        </FormField>
      </div>
    </div>
  )
}

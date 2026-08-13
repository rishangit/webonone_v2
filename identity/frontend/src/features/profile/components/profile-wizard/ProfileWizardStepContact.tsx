import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type PhoneCountry,
} from '@webonone/ui-kit'
import type { ProfileFormValues } from '../../schemas/profileSchemas'

interface ProfileWizardStepContactProps {
  values: ProfileFormValues
  phoneCountry: string
  phoneNational: string
  fieldErrors: Partial<Record<keyof ProfileFormValues, string>>
  isSubmitting: boolean
  onChange: (patch: Partial<ProfileFormValues>) => void
  onPhoneCountryChange: (country: PhoneCountry) => void
  onPhoneNationalChange: (value: string) => void
}

export function ProfileWizardStepContact({
  values,
  phoneCountry,
  phoneNational,
  fieldErrors,
  isSubmitting,
  onChange,
  onPhoneCountryChange,
  onPhoneNationalChange,
}: ProfileWizardStepContactProps) {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const localeValue = values.locale === 'si' ? 'si' : values.locale === 'en' ? 'en' : ''

  return (
    <div className="space-y-4">
      <FormField
        label={t('fields.phoneNumber')}
        htmlFor="profile-wizard-phone"
        error={fieldErrors.phoneNumber ? t(fieldErrors.phoneNumber) : undefined}
      >
        <PhoneInput
          id="profile-wizard-phone"
          withIcon
          country={phoneCountry}
          onCountryChange={onPhoneCountryChange}
          autoComplete="tel"
          placeholder={t('placeholders.phone')}
          value={phoneNational}
          onChange={(e) => onPhoneNationalChange(e.target.value)}
          disabled={isSubmitting}
        />
      </FormField>
      <FormField
        label={t('fields.locale')}
        htmlFor="profile-wizard-locale"
        error={fieldErrors.locale ? t(fieldErrors.locale) : undefined}
      >
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            value={localeValue || undefined}
            onValueChange={(value) => onChange({ locale: value === 'si' ? 'si' : 'en' })}
            disabled={isSubmitting}
          >
            <SelectTrigger id="profile-wizard-locale" className="pl-9">
              <SelectValue placeholder={t('fields.locale')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{tc('english')}</SelectItem>
              <SelectItem value="si">{tc('sinhala')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormField>
    </div>
  )
}

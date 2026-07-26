import { Globe } from 'lucide-react'
import {
  FormField,
  Input,
  InputGroup,
  InputGroupIcon,
  PhoneInput,
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
  return (
    <div className="space-y-4">
      <FormField label="Phone number" htmlFor="profile-wizard-phone" error={fieldErrors.phoneNumber}>
        <PhoneInput
          id="profile-wizard-phone"
          withIcon
          country={phoneCountry}
          onCountryChange={onPhoneCountryChange}
          autoComplete="tel"
          placeholder="555-0100"
          value={phoneNational}
          onChange={(e) => onPhoneNationalChange(e.target.value)}
          disabled={isSubmitting}
        />
      </FormField>
      <FormField label="Locale" htmlFor="profile-wizard-locale" error={fieldErrors.locale}>
        <InputGroup>
          <InputGroupIcon icon={Globe} />
          <Input
            id="profile-wizard-locale"
            inGroup
            placeholder="en-US"
            value={values.locale ?? ''}
            onChange={(e) => onChange({ locale: e.target.value || null })}
            disabled={isSubmitting}
          />
        </InputGroup>
      </FormField>
    </div>
  )
}

import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormField, Input, InputGroup, InputGroupIcon } from '@webonone/ui-kit'
import type { ProfileFormValues } from '../../schemas/profileSchemas'

interface ProfileWizardStepNameProps {
  values: ProfileFormValues
  fieldErrors: Partial<Record<keyof ProfileFormValues, string>>
  isSubmitting: boolean
  onChange: (patch: Partial<ProfileFormValues>) => void
}

export function ProfileWizardStepName({
  values,
  fieldErrors,
  isSubmitting,
  onChange,
}: ProfileWizardStepNameProps) {
  const { t } = useTranslation('profile')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={t('fields.firstName')}
          htmlFor="profile-wizard-firstName"
          required
          error={fieldErrors.firstName ? t(fieldErrors.firstName) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input
              id="profile-wizard-firstName"
              inGroup
              autoComplete="given-name"
              value={values.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              disabled={isSubmitting}
            />
          </InputGroup>
        </FormField>
        <FormField
          label={t('fields.lastName')}
          htmlFor="profile-wizard-lastName"
          required
          error={fieldErrors.lastName ? t(fieldErrors.lastName) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input
              id="profile-wizard-lastName"
              inGroup
              autoComplete="family-name"
              value={values.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              disabled={isSubmitting}
            />
          </InputGroup>
        </FormField>
      </div>
      <FormField
        label={t('fields.displayName')}
        htmlFor="profile-wizard-displayName"
        required
        error={fieldErrors.displayName ? t(fieldErrors.displayName) : undefined}
      >
        <InputGroup>
          <InputGroupIcon icon={User} />
          <Input
            id="profile-wizard-displayName"
            inGroup
            autoComplete="name"
            value={values.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            disabled={isSubmitting}
          />
        </InputGroup>
      </FormField>
    </div>
  )
}

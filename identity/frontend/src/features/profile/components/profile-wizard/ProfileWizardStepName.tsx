import { User } from 'lucide-react'
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          htmlFor="profile-wizard-firstName"
          required
          error={fieldErrors.firstName}
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
          label="Last name"
          htmlFor="profile-wizard-lastName"
          required
          error={fieldErrors.lastName}
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
        label="Display name"
        htmlFor="profile-wizard-displayName"
        required
        error={fieldErrors.displayName}
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

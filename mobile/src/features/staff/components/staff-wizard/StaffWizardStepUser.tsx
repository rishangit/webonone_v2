import { View } from 'react-native'
import { Body, SelectUser } from '@webonone/mobile-ui'
import type { StaffWizardFormValues } from '@/features/staff/schemas/staffSchemas'

type StaffWizardStepUserProps = {
  values: StaffWizardFormValues
  fieldErrors: Record<string, string>
  disabled?: boolean
  onPickUser: () => void
}

export function StaffWizardStepUser({
  values,
  fieldErrors,
  disabled,
  onPickUser,
}: StaffWizardStepUserProps) {
  return (
    <View className="gap-4">
      {fieldErrors.user ? <Body className="text-destructive">{fieldErrors.user}</Body> : null}
      <SelectUser
        selectedUser={
          values.user
            ? {
                id: values.user.id,
                displayName: values.user.displayName,
                email: values.user.email ?? '',
                avatarUrl: values.user.avatarUrl,
              }
            : null
        }
        placeholder="Select a registered user"
        disabled={disabled}
        onPress={onPickUser}
      />
    </View>
  )
}

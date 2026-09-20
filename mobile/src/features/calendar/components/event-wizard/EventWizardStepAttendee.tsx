import { View } from 'react-native'
import { Body, Muted, SelectUser, type UserOption } from '@webonone/mobile-ui'

type EventWizardStepAttendeeProps = {
  attendee: UserOption | null
  onOpenPicker: () => void
  error?: string
  disabled?: boolean
}

export function EventWizardStepAttendee({
  attendee,
  onOpenPicker,
  error,
  disabled,
}: EventWizardStepAttendeeProps) {
  return (
    <View className="gap-3">
      <Muted>Choose the Identity user who will attend this duration-based event.</Muted>
      {error ? <Body className="text-destructive">{error}</Body> : null}
      <SelectUser
        selectedUser={attendee}
        placeholder="Select attendee"
        disabled={disabled}
        onPress={onOpenPicker}
      />
    </View>
  )
}

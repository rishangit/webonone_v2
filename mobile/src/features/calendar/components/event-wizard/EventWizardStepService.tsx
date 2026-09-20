import { View } from 'react-native'
import { Body, Button, Muted } from '@webonone/mobile-ui'
import { formatEventServiceDescription } from '@/features/calendar/services/companyCatalogApi'
import type { EventServiceOption } from '@/features/calendar/schemas/eventSchemas'

type EventWizardStepServiceProps = {
  service: EventServiceOption | null
  onOpenPicker: () => void
  error?: string
}

export function EventWizardStepService({
  service,
  onOpenPicker,
  error,
}: EventWizardStepServiceProps) {
  return (
    <View className="gap-3">
      <Muted>Choose a company catalog service for this event.</Muted>
      {error ? <Body className="text-destructive">{error}</Body> : null}
      {service ? (
        <View className="flex-row items-center justify-between gap-3 rounded-md border border-border p-3">
          <View className="min-w-0 flex-1">
            <Body className="font-medium">{service.name}</Body>
            <Muted className="text-xs">{formatEventServiceDescription(service)}</Muted>
          </View>
          <Button variant="outline" size="sm" onPress={onOpenPicker}>
            Change
          </Button>
        </View>
      ) : (
        <Button variant="outline" onPress={onOpenPicker}>
          Select service
        </Button>
      )}
    </View>
  )
}

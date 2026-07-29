import { Button } from '@webonone/ui-kit'
import { Briefcase } from 'lucide-react'
import type { EventServiceOption } from '@/features/calendar/schemas/eventSchemas'

type EventWizardStepServiceProps = {
  service: EventServiceOption | null
  onOpenPicker: () => void
  error?: string
}

function serviceSubtitle(service: EventServiceOption): string {
  return service.timeMode === 'window'
    ? `Specific time · ${service.startTime ?? '—'}–${service.endTime ?? '—'}`
    : `Duration · ${service.durationMinutes ?? '—'} min`
}

export function EventWizardStepService({
  service,
  onOpenPicker,
  error,
}: EventWizardStepServiceProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose a company catalog service for this event.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {service ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{service.name}</p>
            <p className="truncate text-xs text-muted-foreground">{serviceSubtitle(service)}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onOpenPicker}>
            Change
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={onOpenPicker}>
          <Briefcase className="mr-2 h-4 w-4" aria-hidden />
          Select service
        </Button>
      )}
    </div>
  )
}

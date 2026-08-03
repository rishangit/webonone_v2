import { Button } from '@webonone/ui-kit'
import { MapPin } from 'lucide-react'
import type { EventSpaceOption } from '@/features/calendar/schemas/eventSchemas'

type EventWizardStepWhereProps = {
  space: EventSpaceOption | null
  onOpenPicker: () => void
  error?: string
}

export function EventWizardStepWhere({
  space,
  onOpenPicker,
  error,
}: EventWizardStepWhereProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose the company space where this Specific time event happens.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {space ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{space.name}</p>
            {space.description?.trim() ? (
              <p className="truncate text-xs text-muted-foreground">{space.description}</p>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onOpenPicker}>
            Change
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={onOpenPicker}>
          <MapPin className="mr-2 h-4 w-4" aria-hidden />
          Select space
        </Button>
      )}
    </div>
  )
}

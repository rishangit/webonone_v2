import { Button } from '@webonone/ui-kit'
import { MapPin } from 'lucide-react'
import type { WorkflowSpaceValue } from '@/features/company-catalog/schemas/workflowSchemas'

type WorkflowWizardStepSpaceProps = {
  space: WorkflowSpaceValue | null
  spaceRequired?: boolean
  onOpenPicker: () => void
  onClear?: () => void
  error?: string
}

export function WorkflowWizardStepSpace({
  space,
  spaceRequired = true,
  onOpenPicker,
  onClear,
  error,
}: WorkflowWizardStepSpaceProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {spaceRequired
          ? 'Choose the company space for this workflow step.'
          : 'Optionally choose a company space for check-in.'}
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
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onOpenPicker}>
              Change
            </Button>
            {onClear ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                Clear
              </Button>
            ) : null}
          </div>
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

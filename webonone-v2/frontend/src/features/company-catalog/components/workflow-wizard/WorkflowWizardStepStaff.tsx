import { Button } from '@webonone/ui-kit'
import { Users } from 'lucide-react'
import type { WorkflowStaffValue } from '@/features/company-catalog/schemas/workflowSchemas'

type WorkflowWizardStepStaffProps = {
  staff: WorkflowStaffValue[]
  onOpenPicker: () => void
}

export function WorkflowWizardStepStaff({ staff, onOpenPicker }: WorkflowWizardStepStaffProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Optionally assign one or more staff members to this step.
      </p>
      {staff.length > 0 ? (
        <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
          <div className="min-w-0">
            <p className="font-medium">{staff.length} selected</p>
            <p className="truncate text-xs text-muted-foreground">
              {staff.map((entry) => entry.displayName).join(', ')}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onOpenPicker}>
            Change
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={onOpenPicker}>
          <Users className="mr-2 h-4 w-4" aria-hidden />
          Select staff
        </Button>
      )}
    </div>
  )
}

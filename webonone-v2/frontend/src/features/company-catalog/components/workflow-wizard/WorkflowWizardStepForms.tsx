import { Button } from '@webonone/ui-kit'
import { FileText } from 'lucide-react'
import type { WorkflowFormValue } from '@/features/company-catalog/schemas/workflowSchemas'
import { WorkflowWizardStepAddItemsToggle } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardStepAddItemsToggle'

type WorkflowWizardStepFormsProps = {
  forms: WorkflowFormValue[]
  onOpenPicker: () => void
  showAddItemsToggle?: boolean
  addItemsEnabled?: boolean
  onAddItemsEnabledChange?: (value: boolean) => void
  addItemsFromLibraryEnabled?: boolean
  onAddItemsFromLibraryEnabledChange?: (value: boolean) => void
}

export function WorkflowWizardStepForms({
  forms,
  onOpenPicker,
  showAddItemsToggle = false,
  addItemsEnabled = false,
  onAddItemsEnabledChange,
  addItemsFromLibraryEnabled = false,
  onAddItemsFromLibraryEnabledChange,
}: WorkflowWizardStepFormsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Optionally assign one or more published Design forms to this step.
      </p>
      {forms.length > 0 ? (
        <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
          <div className="min-w-0">
            <p className="font-medium">{forms.length} selected</p>
            <p className="truncate text-xs text-muted-foreground">
              {forms.map((form) => form.name).join(', ')}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onOpenPicker}>
            Change
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={onOpenPicker}>
          <FileText className="mr-2 h-4 w-4" aria-hidden />
          Select forms
        </Button>
      )}
      {showAddItemsToggle && onAddItemsEnabledChange ? (
        <WorkflowWizardStepAddItemsToggle
          addItemsEnabled={addItemsEnabled}
          onAddItemsEnabledChange={onAddItemsEnabledChange}
          addItemsFromLibraryEnabled={addItemsFromLibraryEnabled}
          onAddItemsFromLibraryEnabledChange={onAddItemsFromLibraryEnabledChange}
        />
      ) : null}
    </div>
  )
}

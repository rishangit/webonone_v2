import { useCallback } from 'react'
import {
  OptionSelectionDialog,
  type LoadSelectionOptionsFn,
  type SelectionOption,
} from '@/shared/components/OptionSelectionDialog'
import { staffApi } from '@/features/staff/services/staffApi'
import type { WorkflowStaffValue } from '@/features/company-catalog/schemas/workflowSchemas'

type StaffSelectionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSelected: WorkflowStaffValue[]
  onSelect: (staff: WorkflowStaffValue[]) => void
  nestedDismissGuard?: boolean
}

export function StaffSelectionDialog({
  open,
  onOpenChange,
  initialSelected,
  onSelect,
  nestedDismissGuard,
}: StaffSelectionDialogProps) {
  const loadOptions: LoadSelectionOptionsFn = useCallback(async ({ search, page, pageSize }) => {
    const result = await staffApi.list({ q: search, page, pageSize })
    return {
      items: result.items.map((entry) => ({
        id: entry.id,
        name: entry.displayName,
        description: entry.email?.trim() ? entry.email : null,
      })),
      hasMore: page * pageSize < result.total,
    }
  }, [])

  function handleSelect(options: SelectionOption[]) {
    onSelect(options.map((option) => ({ id: option.id, displayName: option.name })))
  }

  return (
    <OptionSelectionDialog
      open={open}
      onOpenChange={onOpenChange}
      loadOptions={loadOptions}
      multiple
      initialSelected={initialSelected.map((entry) => ({
        id: entry.id,
        name: entry.displayName,
      }))}
      onSelect={handleSelect}
      title="Select staff"
      description="Choose one or more staff members for this workflow step."
      searchPlaceholder="Search staff…"
      emptyMessage="No staff found."
      nestedDismissGuard={nestedDismissGuard}
    />
  )
}

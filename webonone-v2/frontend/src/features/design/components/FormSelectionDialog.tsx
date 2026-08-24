import { useCallback } from 'react'
import {
  OptionSelectionDialog,
  type LoadSelectionOptionsFn,
  type SelectionOption,
} from '@/shared/components/OptionSelectionDialog'
import { designFormsApi } from '@/features/design/services/designFormsApi'
import type { WorkflowFormValue } from '@/features/company-catalog/schemas/workflowSchemas'

type FormSelectionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSelected: WorkflowFormValue[]
  onSelect: (forms: WorkflowFormValue[]) => void
  nestedDismissGuard?: boolean
}

export function FormSelectionDialog({
  open,
  onOpenChange,
  initialSelected,
  onSelect,
  nestedDismissGuard,
}: FormSelectionDialogProps) {
  const loadOptions: LoadSelectionOptionsFn = useCallback(async ({ search, page, pageSize }) => {
    const result = await designFormsApi.listPublished(200)
    const q = search.trim().toLowerCase()
    const filtered = q
      ? result.items.filter((form) => form.name.toLowerCase().includes(q))
      : result.items
    const start = (page - 1) * pageSize
    const slice = filtered.slice(start, start + pageSize)
    return {
      items: slice.map((form) => ({ id: form.id, name: form.name })),
      hasMore: start + pageSize < filtered.length,
    }
  }, [])

  function handleSelect(options: SelectionOption[]) {
    onSelect(options.map((option) => ({ id: option.id, name: option.name })))
  }

  return (
    <OptionSelectionDialog
      open={open}
      onOpenChange={onOpenChange}
      loadOptions={loadOptions}
      multiple
      initialSelected={initialSelected.map((form) => ({ id: form.id, name: form.name }))}
      onSelect={handleSelect}
      title="Select forms"
      description="Choose published Design forms for this workflow step."
      searchPlaceholder="Search forms…"
      emptyMessage="No published forms found."
      nestedDismissGuard={nestedDismissGuard}
    />
  )
}

import { ImagePreview, itemListThumbClassName } from '@webonone/ui-kit'
import type { ServiceWorkflowStaff } from '@/features/company-catalog/types/companyCatalog.types'

type WorkflowStaffNamesProps = {
  staff: ServiceWorkflowStaff[]
  emptyLabel: string
}

export function WorkflowStaffNames({ staff, emptyLabel }: WorkflowStaffNamesProps) {
  if (staff.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {staff.map((entry) => (
        <div key={entry.id} className="flex min-w-0 items-center gap-3">
          <ImagePreview
            src={entry.avatarUrl ?? null}
            alt={entry.displayName}
            mode="view"
            className={itemListThumbClassName}
          />
          <p className="truncate text-sm text-muted-foreground">{entry.displayName}</p>
        </div>
      ))}
    </div>
  )
}

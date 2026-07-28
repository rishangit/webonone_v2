import { EditableSectionCard } from '@/features/settings/companies/components/EditableSectionCard'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type StaffUserCardProps = {
  staff: CompanyStaff
  canEdit?: boolean
  onEdit?: () => void
}

export function StaffUserCard({ staff, canEdit, onEdit }: StaffUserCardProps) {
  return (
    <EditableSectionCard
      title="User"
      description="Identity user linked as company staff"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Name</p>
          <p className="text-sm text-foreground">{staff.displayName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Email</p>
          <p className="text-sm text-foreground">{staff.email ?? '—'}</p>
        </div>
      </div>
    </EditableSectionCard>
  )
}

import { useNavigate } from 'react-router-dom'
import { Button } from '@webonone/ui-kit'
import { EditableSectionCard } from '@/features/settings/companies/components/EditableSectionCard'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type StaffUserCardProps = {
  staff: CompanyStaff
  canEdit?: boolean
  canViewProfile?: boolean
  onEdit?: () => void
}

export function StaffUserCard({
  staff,
  canEdit,
  canViewProfile,
  onEdit,
}: StaffUserCardProps) {
  const navigate = useNavigate()

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
        {canViewProfile ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/identity/users/${encodeURIComponent(staff.userId)}`)}
          >
            View profile
          </Button>
        ) : null}
      </div>
    </EditableSectionCard>
  )
}

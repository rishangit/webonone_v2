import {
  isStatusTagVariant,
  StatusTag,
} from '@webonone/ui-kit'
import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'
import { EditableSectionCard } from './EditableSectionCard'

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

type CompanyProfileCardProps = {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyProfileCard({ detail, canEdit, onEdit }: CompanyProfileCardProps) {
  return (
    <EditableSectionCard
      title="Company profile"
      description="Identity of the company on the platform"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-semibold">{detail.name}</h3>
        <StatusTag variant={detail.status} />
      </div>
      {detail.role ? (
        isStatusTagVariant(detail.role) ? (
          <StatusTag variant={detail.role} className="shrink-0" />
        ) : (
          <span className="text-sm text-muted-foreground">{detail.role}</span>
        )
      ) : (
        <p className="text-sm text-muted-foreground">Super admin view</p>
      )}
      <ReadOnlyField label="Description" value={detail.description} />
      <ReadOnlyField label="Company size" value={detail.companySize} />
    </EditableSectionCard>
  )
}

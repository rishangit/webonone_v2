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

type CompanyContactCardProps = {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyContactCard({ detail, canEdit, onEdit }: CompanyContactCardProps) {
  const isEmpty = !detail.contactEmail && !detail.contactPhone

  return (
    <EditableSectionCard
      title="Contact information"
      description="How customers and the platform reach this company"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          No contact details yet. Edit this section to add email and phone.
        </p>
      ) : null}
      <ReadOnlyField label="Contact email" value={detail.contactEmail} />
      <ReadOnlyField label="Contact phone" value={detail.contactPhone} />
    </EditableSectionCard>
  )
}

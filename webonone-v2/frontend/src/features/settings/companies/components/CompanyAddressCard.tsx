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

type CompanyAddressCardProps = {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyAddressCard({ detail, canEdit, onEdit }: CompanyAddressCardProps) {
  const isEmpty =
    !detail.addressLine1 && !detail.city && !detail.country && !detail.addressLine2

  return (
    <EditableSectionCard
      title="Address information"
      description="Postal and street address for this company"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          No address details yet. Edit this section to add a street address.
        </p>
      ) : null}
      <ReadOnlyField label="Address line 1" value={detail.addressLine1} />
      <ReadOnlyField label="Address line 2" value={detail.addressLine2} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReadOnlyField label="City" value={detail.city} />
        <ReadOnlyField label="State / region" value={detail.stateRegion} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Postal code" value={detail.postalCode} />
        <ReadOnlyField label="Country" value={detail.country} />
      </div>
    </EditableSectionCard>
  )
}

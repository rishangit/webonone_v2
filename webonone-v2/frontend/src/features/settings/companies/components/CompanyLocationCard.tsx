import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'
import { CompanyMapPicker } from './CompanyMapPicker'
import { EditableSectionCard } from './EditableSectionCard'

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

type CompanyLocationCardProps = {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyLocationCard({ detail, canEdit, onEdit }: CompanyLocationCardProps) {
  const isEmpty =
    !detail.addressLine1 &&
    !detail.city &&
    !detail.country &&
    detail.latitude === null &&
    detail.longitude === null

  return (
    <EditableSectionCard
      title="Location information"
      description="Map pin and postal / street address"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <CompanyMapPicker mode="view" latitude={detail.latitude} longitude={detail.longitude} />

      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          No location details yet. Edit this section to set a map pin and address.
        </p>
      ) : null}
      {detail.mapFormattedAddress ? (
        <ReadOnlyField label="Map address" value={detail.mapFormattedAddress} />
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

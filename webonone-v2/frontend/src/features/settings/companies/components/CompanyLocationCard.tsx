import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'
import { CompanyMapPicker } from './CompanyMapPicker'
import { EditableSectionCard } from './EditableSectionCard'

type CompanyLocationCardProps = {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
  /** Stretch card + map to fill the column height (beside Contact + Address). */
  fillHeight?: boolean
}

export function CompanyLocationCard({
  detail,
  canEdit,
  onEdit,
  fillHeight = false,
}: CompanyLocationCardProps) {
  return (
    <EditableSectionCard
      title="Location information"
      description="Map pin for this company"
      canEdit={canEdit}
      onEdit={onEdit}
      className={fillHeight ? 'flex h-full min-h-[20rem] flex-col' : undefined}
      contentClassName={
        fillHeight ? 'flex min-h-0 flex-1 flex-col [&>*:first-child]:min-h-0 [&>*:first-child]:flex-1' : undefined
      }
    >
      <CompanyMapPicker
        mode="view"
        latitude={detail.latitude}
        longitude={detail.longitude}
        fillHeight={fillHeight}
      />
      {detail.mapFormattedAddress ? (
        <div className="shrink-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Map address
          </p>
          <p className="text-sm">{detail.mapFormattedAddress}</p>
        </div>
      ) : null}
    </EditableSectionCard>
  )
}

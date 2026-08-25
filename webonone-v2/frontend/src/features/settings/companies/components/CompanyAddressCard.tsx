import { useTranslation } from 'react-i18next'
import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'
import { formatCountryName } from '@/features/settings/companies/utils/formatCountryName'
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
  const { t } = useTranslation('settings')
  const isEmpty =
    !detail.addressLine1 && !detail.city && !detail.country && !detail.addressLine2

  return (
    <EditableSectionCard
      title={t('companyCards.address.title')}
      description={t('companyCards.address.description')}
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">{t('companyCards.address.empty')}</p>
      ) : null}
      <ReadOnlyField label={t('companyCards.address.line1')} value={detail.addressLine1} />
      <ReadOnlyField label={t('companyCards.address.line2')} value={detail.addressLine2} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReadOnlyField label={t('companyCards.address.city')} value={detail.city} />
        <ReadOnlyField label={t('companyCards.address.stateRegion')} value={detail.stateRegion} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReadOnlyField label={t('companyCards.address.postalCode')} value={detail.postalCode} />
        <ReadOnlyField
          label={t('companyCards.address.country')}
          value={formatCountryName(detail.country) || detail.country}
        />
      </div>
    </EditableSectionCard>
  )
}

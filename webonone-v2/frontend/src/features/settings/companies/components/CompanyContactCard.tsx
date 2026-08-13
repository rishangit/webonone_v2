import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('settings')
  const isEmpty = !detail.contactEmail && !detail.contactPhone

  return (
    <EditableSectionCard
      title={t('companyCards.contact.title')}
      description={t('companyCards.contact.description')}
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">{t('companyCards.contact.empty')}</p>
      ) : null}
      <ReadOnlyField label={t('companyCards.contact.contactEmail')} value={detail.contactEmail} />
      <ReadOnlyField label={t('companyCards.contact.contactPhone')} value={detail.contactPhone} />
    </EditableSectionCard>
  )
}

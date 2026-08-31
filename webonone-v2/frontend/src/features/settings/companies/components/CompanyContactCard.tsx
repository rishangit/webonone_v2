import { Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReadOnlyField } from '@webonone/ui-kit'
import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'
import { EditableSectionCard } from './EditableSectionCard'

type CompanyContactCardProps = {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyContactCard({ detail, canEdit, onEdit }: CompanyContactCardProps) {
  const { t } = useTranslation('settings')
  const isEmpty =
    !detail.contactPerson && !detail.contactEmail && !detail.contactPhone

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
      <ReadOnlyField
        label={t('companyCards.contact.contactPerson')}
        value={detail.contactPerson?.displayName}
      />
      <ReadOnlyField
        label={t('companyCards.contact.contactEmail')}
        value={detail.contactEmail}
        icon={Mail}
      />
      <ReadOnlyField
        label={t('companyCards.contact.contactPhone')}
        value={detail.contactPhone}
        icon={Phone}
      />
    </EditableSectionCard>
  )
}

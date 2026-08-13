import { TagChip } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { CompanyTag } from '@/features/settings/basic/services/companyApi'
import { EditableSectionCard } from './EditableSectionCard'

type CompanyTagsCardProps = {
  tags: CompanyTag[]
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyTagsCard({ tags, canEdit, onEdit }: CompanyTagsCardProps) {
  const { t } = useTranslation('settings')
  return (
    <EditableSectionCard
      title={t('companyCards.tags.title')}
      description={t('companyCards.tags.description')}
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('companyCards.tags.empty')}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      )}
    </EditableSectionCard>
  )
}

import {
  isStatusTagVariant,
  StatusTag,
} from '@webonone/ui-kit'
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

type CompanyProfileCardProps = {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}

export function CompanyProfileCard({ detail, canEdit, onEdit }: CompanyProfileCardProps) {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')

  return (
    <EditableSectionCard
      title={t('companyCards.profile.title')}
      description={t('companyCards.profile.description')}
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
        <p className="text-sm text-muted-foreground">{t('companyCards.profile.superAdminView')}</p>
      )}
      <ReadOnlyField label={tc('description')} value={detail.description} />
      <ReadOnlyField label={t('companyCards.profile.companySize')} value={detail.companySize} />
      {detail.webUrl ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('companyCards.profile.webUrl')}
          </p>
          <a
            href={detail.webUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-primary underline-offset-4 hover:underline"
          >
            {detail.webUrl}
          </a>
          <p className="text-xs text-muted-foreground">{t('companyCards.profile.webUrlHint')}</p>
        </div>
      ) : null}
    </EditableSectionCard>
  )
}

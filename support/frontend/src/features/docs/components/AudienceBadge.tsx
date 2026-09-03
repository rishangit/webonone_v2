import { useTranslation } from 'react-i18next'
import { StatusTag, type StatusTagVariant } from '@webonone/ui-kit'
import type { ArticleAudience } from '@/features/docs/content/types'

const AUDIENCE_VARIANT: Record<ArticleAudience, StatusTagVariant | null> = {
  all: null,
  owner: 'company_admin',
  staff: 'staff',
  member: 'member',
  super_admin: 'super_admin',
}

const AUDIENCE_KEY: Record<ArticleAudience, string> = {
  all: 'audienceAll',
  owner: 'audienceOwner',
  staff: 'audienceStaff',
  member: 'audienceMember',
  super_admin: 'audienceSuperAdmin',
}

export function AudienceBadge({ audience }: { audience: ArticleAudience }) {
  const { t } = useTranslation('docs')
  const variant = AUDIENCE_VARIANT[audience]
  if (!variant) {
    return null
  }
  return <StatusTag variant={variant}>{t(AUDIENCE_KEY[audience])}</StatusTag>
}

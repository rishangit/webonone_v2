import { StatusTag } from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import type { EntityStatus } from '@/shared/types/data.types'

export function EntityStatusTag({ status }: { status: EntityStatus }) {
  const { t } = useTranslation('tags')
  return (
    <StatusTag variant={status === 'verified' ? 'approved' : 'pending'}>
      {status === 'verified' ? t('verified') : t('unverified')}
    </StatusTag>
  )
}

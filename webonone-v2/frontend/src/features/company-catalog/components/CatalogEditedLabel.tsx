import { useTranslation } from 'react-i18next'
import { StatusTag } from '@webonone/ui-kit'

export function CatalogEditedLabel({ show }: { show: boolean }) {
  const { t } = useTranslation('catalog')
  if (!show) return null
  return (
    <StatusTag variant="pending" className="ml-2 align-middle">
      {t('detail.edited')}
    </StatusTag>
  )
}

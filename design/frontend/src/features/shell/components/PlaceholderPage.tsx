import { FeaturePage } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { t } = useTranslation('forms')
  return (
    <FeaturePage title={title} description={description}>
      <p className="text-sm text-muted-foreground">{t('comingLater')}</p>
    </FeaturePage>
  )
}

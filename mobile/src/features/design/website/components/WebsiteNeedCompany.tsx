import { Alert, AlertDescription, FeatureScreen } from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'

export function WebsiteNeedCompany({ description }: { description: string }) {
  const { t } = useTranslation('website')
  return (
    <FeatureScreen title={t('title')} description={description}>
      <Alert>
        <AlertDescription>{t('needCompany')}</AlertDescription>
      </Alert>
    </FeatureScreen>
  )
}

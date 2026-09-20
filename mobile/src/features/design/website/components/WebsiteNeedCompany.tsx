import { Alert, AlertDescription, FeatureScreen } from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { WebsiteHubTabs } from '@/features/design/website/components/WebsiteHubTabs'
import type { WebsiteSection } from '@/features/design/utils/designPaths'

export function WebsiteNeedCompany({
  section,
  description,
}: {
  section: WebsiteSection
  description: string
}) {
  const { t } = useTranslation('website')
  return (
    <FeatureScreen title={t('title')} description={description}>
      <WebsiteHubTabs section={section} />
      <Alert>
        <AlertDescription>{t('needCompany')}</AlertDescription>
      </Alert>
    </FeatureScreen>
  )
}

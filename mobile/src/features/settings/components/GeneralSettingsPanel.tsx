import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card, Muted, ReadOnlyField, Subheading } from '@webonone/mobile-ui'
import { getWebOnOneAppVersionLabel } from '@/features/settings/utils/appVersion'

export function GeneralSettingsPanel() {
  const { t } = useTranslation('settings')
  const versionLabel = getWebOnOneAppVersionLabel()

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Subheading>{t('general.about.title')}</Subheading>
        <Muted>{t('general.about.description')}</Muted>
      </View>
      <ReadOnlyField label={t('general.about.versionLabel')} value={versionLabel} />
    </Card>
  )
}

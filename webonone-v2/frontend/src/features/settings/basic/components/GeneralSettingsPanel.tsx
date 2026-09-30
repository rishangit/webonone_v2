import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ReadOnlyField,
} from '@webonone/ui-kit'
import { getWebOnOneAppVersionLabel } from '@/features/settings/basic/utils/appVersion'
import { getWebOnOneDesktopBridge } from '@/shared/types/webononeDesktop'

export function GeneralSettingsPanel() {
  const { t } = useTranslation('settings')
  const versionLabel = getWebOnOneAppVersionLabel()
  const desktopShellVersion = getWebOnOneDesktopBridge()?.appVersion ?? null

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('general.about.title')}</CardTitle>
          <CardDescription>{t('general.about.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReadOnlyField label={t('general.about.versionLabel')} value={versionLabel} />
          {desktopShellVersion ? (
            <ReadOnlyField
              label={t('general.about.desktopVersionLabel')}
              value={desktopShellVersion}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

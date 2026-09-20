import { Linking, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Monitor } from 'lucide-react-native'
import { Button, Card, Muted, Subheading, useThemeColors } from '@webonone/mobile-ui'
import { env } from '@/shared/config/env'

const DESKTOP_INSTALLER_FILENAME = 'WebOnOne-Setup.exe'

function getDesktopInstallerUrl(): string {
  return `${env.webononeOrigin}/downloads/${DESKTOP_INSTALLER_FILENAME}`
}

function getDesktopHelpUrl(): string {
  return `${env.supportOrigin}/docs/getting-started/desktop-app`
}

export function DownloadsSettingsPanel() {
  const { t } = useTranslation('settings')
  const colors = useThemeColors()
  async function openUrl(url: string) {
    const supported = await Linking.canOpenURL(url)
    if (!supported) return
    await Linking.openURL(url)
  }

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Subheading>{t('downloads.desktop.title')}</Subheading>
        <Muted>{t('downloads.desktop.description')}</Muted>
      </View>

      <View className="flex-row gap-3 rounded-lg border border-border bg-card p-4">
        <Monitor size={28} color={colors.primary} />
        <View className="min-w-0 flex-1 gap-2">
          <Muted>{t('downloads.desktop.summary')}</Muted>
          <Muted>• {t('downloads.desktop.bulletSync')}</Muted>
          <Muted>• {t('downloads.desktop.bulletWindows')}</Muted>
          <Muted>• {t('downloads.desktop.bulletInternet')}</Muted>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Button onPress={() => void openUrl(getDesktopInstallerUrl())}>
          {t('downloads.desktop.download')}
        </Button>
        <Button variant="outline" onPress={() => void openUrl(getDesktopHelpUrl())}>
          {t('downloads.desktop.help')}
        </Button>
      </View>

      <Muted>{t('downloads.desktop.afterInstall')}</Muted>
    </Card>
  )
}

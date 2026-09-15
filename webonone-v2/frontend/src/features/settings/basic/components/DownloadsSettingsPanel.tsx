import { Download, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@webonone/ui-kit'
import { getSupportOrigin } from '@/features/support/utils/supportConfig'
import {
  getDesktopInstallerFilename,
  getDesktopInstallerUrl,
} from '@/features/settings/basic/utils/desktopConfig'

export function DownloadsSettingsPanel() {
  const { t } = useTranslation('settings')
  const installerUrl = getDesktopInstallerUrl()
  const helpUrl = `${getSupportOrigin()}/docs/getting-started/desktop-app`

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('downloads.desktop.title')}</CardTitle>
          <CardDescription>{t('downloads.desktop.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 rounded-lg border border-border bg-glass-bg p-4">
            <Monitor className="mt-0.5 h-8 w-8 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 space-y-2">
              <p className="text-sm text-muted-foreground">{t('downloads.desktop.summary')}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>{t('downloads.desktop.bulletSync')}</li>
                <li>{t('downloads.desktop.bulletWindows')}</li>
                <li>{t('downloads.desktop.bulletInternet')}</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="h-10">
              <a href={installerUrl} download={getDesktopInstallerFilename()}>
                <Download className="mr-2 h-4 w-4" aria-hidden />
                {t('downloads.desktop.download')}
              </a>
            </Button>
            <Button asChild variant="outline" className="h-10">
              <a href={helpUrl} target="_blank" rel="noreferrer">
                {t('downloads.desktop.help')}
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">{t('downloads.desktop.afterInstall')}</p>
        </CardContent>
      </Card>
    </div>
  )
}

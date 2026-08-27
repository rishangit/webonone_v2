import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@webonone/ui-kit'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'
import type { ApiTheme } from '../services/themeApi'

type ThemeMetaCardProps = {
  theme: ApiTheme
  isActive: boolean
}

export function ThemeMetaCard({ theme, isActive }: ThemeMetaCardProps) {
  const { t, i18n } = useTranslation('settings')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('themeDetails')}</CardTitle>
        <CardDescription>{t('themeMetaDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('type')}
          </p>
          <p className="text-sm">{theme.isSystem ? t('systemThemeType') : t('customTheme')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('status')}
          </p>
          <p className="text-sm">{isActive ? t('active') : t('inactive')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('created')}
          </p>
          <p className="text-sm">{formatLocaleDateTime(theme.createdAt, i18n.language)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('updated')}
          </p>
          <p className="text-sm">{formatLocaleDateTime(theme.updatedAt, i18n.language)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

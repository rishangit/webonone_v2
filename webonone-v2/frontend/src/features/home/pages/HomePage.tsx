import { FeaturePage } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/app/store/hooks'

export function HomePage() {
  const { t } = useTranslation('home')
  const { user, accessToken } = useAppSelector((s) => s.auth)

  return (
    <FeaturePage
      title={t('welcome', { name: user?.displayName ?? t('welcomeFallbackName') })}
      description={t('description')}
    >
      <p className="text-sm text-muted-foreground">
        {accessToken ? t('sessionActive') : t('notSignedIn')}
      </p>
    </FeaturePage>
  )
}

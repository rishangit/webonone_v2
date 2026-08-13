import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { providersActions } from '@/features/providers/store'
import type { ProviderInfo } from '@/shared/types/email.types'

function statusClassName(status: ProviderInfo['connectionStatus']): string {
  return status === 'connected' ? 'text-primary' : 'text-destructive'
}

export function ProvidersPage() {
  const { t } = useTranslation('shell')
  const dispatch = useAppDispatch()
  const { provider, status, error, testStatus, testMessage } = useAppSelector((s) => s.providers)

  const loading = status === 'loading' && !provider
  const testing = testStatus === 'testing'

  usePlatformLoading(loading ? t('providers.loading') : null)

  useEffect(() => {
    dispatch(providersActions.loadRequested())
  }, [dispatch])

  function handleTestConnection() {
    dispatch(providersActions.testConnectionRequested())
  }

  return (
    <FeaturePage title={t('providersTitle')} description={t('providersDescription')}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {testMessage ? (
        <Alert>
          <AlertDescription>{testMessage}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && provider ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4 text-base">
              <span>{t('providers.smtpTitle')}</span>
              <span className={`text-sm font-normal ${statusClassName(provider.connectionStatus)}`}>
                {provider.connectionStatus === 'connected'
                  ? t('providers.connected')
                  : t('providers.disconnected')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">{t('providers.host')}:</span>{' '}
              {provider.host || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">{t('providers.port')}:</span> {provider.port}
            </p>
            <p>
              <span className="text-muted-foreground">{t('providers.from')}:</span>{' '}
              {provider.fromName ? `${provider.fromName} <${provider.fromAddress}>` : provider.fromAddress}
            </p>
            <p className="text-muted-foreground">{t('providers.credentialsHint')}</p>
            <Button type="button" onClick={handleTestConnection} disabled={testing}>
              {testing ? t('providers.testing') : t('providers.testConnection')}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </FeaturePage>
  )
}

import { useEffect } from 'react'
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

function statusLabel(status: ProviderInfo['connectionStatus']): string {
  return status === 'connected' ? 'Connected' : 'Disconnected'
}

function statusClassName(status: ProviderInfo['connectionStatus']): string {
  return status === 'connected' ? 'text-primary' : 'text-destructive'
}

export function ProvidersPage() {
  const dispatch = useAppDispatch()
  const { provider, status, error, testStatus, testMessage } = useAppSelector((s) => s.providers)

  const loading = status === 'loading' && !provider
  const testing = testStatus === 'testing'

  usePlatformLoading(loading ? 'Loading providers…' : null)

  useEffect(() => {
    dispatch(providersActions.loadRequested())
  }, [dispatch])

  function handleTestConnection() {
    dispatch(providersActions.testConnectionRequested())
  }

  return (
    <FeaturePage
      title="Email providers"
      description="SMTP configuration (non-secret values). Passwords are stored in server environment only."
    >
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
              <span>SMTP provider</span>
              <span className={`text-sm font-normal ${statusClassName(provider.connectionStatus)}`}>
                {statusLabel(provider.connectionStatus)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Host:</span> {provider.host || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Port:</span> {provider.port}
            </p>
            <p>
              <span className="text-muted-foreground">From:</span>{' '}
              {provider.fromName ? `${provider.fromName} <${provider.fromAddress}>` : provider.fromAddress}
            </p>
            <p className="text-muted-foreground">
              SMTP credentials are not shown here. Configure `SMTP_USER` and `SMTP_PASSWORD` in the
              backend `.env` file.
            </p>
            <Button type="button" onClick={handleTestConnection} disabled={testing}>
              {testing ? 'Testing…' : 'Test connection'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </FeaturePage>
  )
}

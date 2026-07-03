import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  LoadingState,
} from '@webonone/ui-kit'
import { emailApi } from '@/shared/services/emailApi'
import type { ProviderInfo } from '@/shared/types/email.types'

function statusLabel(status: ProviderInfo['connectionStatus']): string {
  return status === 'connected' ? 'Connected' : 'Disconnected'
}

function statusClassName(status: ProviderInfo['connectionStatus']): string {
  return status === 'connected' ? 'text-primary' : 'text-destructive'
}

export function ProvidersPage() {
  const [provider, setProvider] = useState<ProviderInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)

  async function loadProvider() {
    setLoading(true)
    setError(null)
    try {
      const data = await emailApi.getProviders()
      setProvider(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load provider')
      setProvider(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProvider()
  }, [])

  async function handleTestConnection() {
    setTesting(true)
    setTestMessage(null)
    setError(null)
    try {
      const result = await emailApi.testProviderConnection()
      setTestMessage(result.ok ? 'Connection successful' : 'Connection failed')
      await loadProvider()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed')
    } finally {
      setTesting(false)
    }
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

      {loading ? <LoadingState label="Loading providers…" /> : null}

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
            <Button type="button" onClick={() => void handleTestConnection()} disabled={testing}>
              {testing ? 'Testing…' : 'Test connection'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </FeaturePage>
  )
}

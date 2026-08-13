import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { gatewayActions } from '@/features/gateway/store'
import type { GatewayMode } from '@/features/gateway/types/gateway.types'
import {
  gatewaySettingsSchema,
  gatewayTestSchema,
  type GatewaySettingsFormValues,
  type GatewayTestFormValues,
} from '../schemas/gatewaySchemas'

export function GatewaySettingsCard() {
  const { t } = useTranslation('gateway')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { config, status, error, saveMessage, testStatus, testMessage } = useAppSelector(
    (s) => s.gateway,
  )

  const [mode, setMode] = useState<GatewayMode>('mobile_device')
  const [senderId, setSenderId] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [toNumber, setToNumber] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof GatewaySettingsFormValues, string>>
  >({})
  const [testFieldErrors, setTestFieldErrors] = useState<
    Partial<Record<keyof GatewayTestFormValues, string>>
  >({})

  const [awaitingSave, setAwaitingSave] = useState(false)
  const [awaitingTest, setAwaitingTest] = useState(false)

  const loading = status === 'loading' && !config
  const saving = status === 'saving'
  const testing = testStatus === 'testing'

  usePlatformLoading(loading ? t('loading') : null)

  useEffect(() => {
    if (!config) return
    setMode(config.mode)
    setSenderId(config.senderId ?? '')
    setApiToken('')
  }, [config])

  useEffect(() => {
    if (!awaitingSave) return
    if (status === 'idle' && saveMessage === 'saved') {
      setAwaitingSave(false)
      toast({ title: 'Gateway settings saved' })
      dispatch(gatewayActions.clearMessages())
    }
    if (status === 'error') {
      setAwaitingSave(false)
      toast({ title: 'Failed to save gateway', description: error ?? undefined, variant: 'destructive' })
      dispatch(gatewayActions.clearMessages())
    }
  }, [awaitingSave, dispatch, error, saveMessage, status, toast])

  useEffect(() => {
    if (!awaitingTest) return
    if (testStatus === 'idle' && testMessage) {
      setAwaitingTest(false)
      toast({ title: 'Test SMS sent', description: testMessage })
      dispatch(gatewayActions.clearMessages())
    }
    if (testStatus === 'error') {
      setAwaitingTest(false)
      toast({ title: 'Failed to send test SMS', description: error ?? undefined, variant: 'destructive' })
      dispatch(gatewayActions.clearMessages())
    }
  }, [awaitingTest, dispatch, error, testMessage, testStatus, toast])

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const parsed = gatewaySettingsSchema.safeParse({ mode, senderId, apiToken })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})

    if (parsed.data.mode === 'text_lk' && !parsed.data.apiToken?.trim() && !config?.hasApiToken) {
      setFieldErrors({ apiToken: 'API token is required for Text.lk' })
      return
    }

    dispatch(
      gatewayActions.saveRequested({
        mode: parsed.data.mode,
        senderId: parsed.data.mode === 'text_lk' ? parsed.data.senderId?.trim() : undefined,
        apiToken: parsed.data.apiToken?.trim() || undefined,
      }),
    )
    setAwaitingSave(true)
  }

  function handleTest(event: React.FormEvent) {
    event.preventDefault()
    const parsed = gatewayTestSchema.safeParse({ toNumber })
    if (!parsed.success) {
      setTestFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setTestFieldErrors({})
    dispatch(gatewayActions.testRequested({ toNumber: parsed.data.toNumber }))
    setAwaitingTest(true)
  }

  const statusLabel =
    config?.mode === 'text_lk'
      ? config.configured
        ? t('statusConfigured')
        : t('statusNotConfigured')
      : config
        ? t('modeMobile')
        : null

  if (loading || !config) {
    return null
  }

  return (
    <div className="space-y-6">
      {error && !awaitingSave && !awaitingTest ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4 text-base">
            <span>{t('modeLabel')}</span>
            {statusLabel ? (
              <span
                className={`text-sm font-normal ${
                  config.mode === 'text_lk' && !config.configured
                    ? 'text-destructive'
                    : 'text-primary'
                }`}
              >
                {statusLabel}
              </span>
            ) : null}
          </CardTitle>
          <CardDescription>
            <a
              href="https://app.text.lk/developers"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t('developersLink')}
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSave} className="space-y-6">
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as GatewayMode)}
              className="space-y-3"
            >
              <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                <RadioGroupItem value="mobile_device" id="mode-mobile" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="mode-mobile">{t('modeMobile')}</Label>
                  <p className="text-sm text-muted-foreground">{t('modeMobileHint')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                <RadioGroupItem value="text_lk" id="mode-textlk" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="mode-textlk">{t('modeTextLk')}</Label>
                  <p className="text-sm text-muted-foreground">{t('modeTextLkHint')}</p>
                </div>
              </div>
            </RadioGroup>

            {mode === 'text_lk' ? (
              <div className="space-y-4">
                <FormField label={t('senderId')} htmlFor="senderId" required error={fieldErrors.senderId}>
                  <Input
                    id="senderId"
                    value={senderId}
                    maxLength={11}
                    onChange={(e) => setSenderId(e.target.value)}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">{t('senderIdHint')}</p>
                </FormField>
                <FormField label={t('apiToken')} htmlFor="apiToken" error={fieldErrors.apiToken}>
                  <Input
                    id="apiToken"
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    autoComplete="new-password"
                    placeholder={
                      config.hasApiToken ? t('apiTokenPlaceholderKeep') : t('apiTokenPlaceholderNew')
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.hasApiToken ? t('hasToken') : t('noToken')} — {t('apiTokenHint')}
                  </p>
                </FormField>
              </div>
            ) : null}

            <Button type="submit" disabled={saving}>
              {saving ? t('saving') : t('save')}
            </Button>
          </Form>
        </CardContent>
      </Card>

      {config.mode === 'text_lk' && config.hasApiToken ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('testTitle')}</CardTitle>
            <CardDescription>{t('testDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleTest} className="space-y-4">
              <FormField
                label={t('toNumber')}
                htmlFor="toNumber"
                required
                error={testFieldErrors.toNumber}
              >
                <Input
                  id="toNumber"
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                  placeholder="+94771234567"
                  autoComplete="tel"
                />
              </FormField>
              <Button type="submit" variant="outline" disabled={testing || !config.configured}>
                {testing ? t('testing') : t('testSend')}
              </Button>
            </Form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

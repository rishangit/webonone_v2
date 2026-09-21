import { type FormEvent, useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
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
  Textarea,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import {
  pushBroadcastFormSchema,
  type PushBroadcastFormValues,
} from '@/features/settings/basic/schemas/pushBroadcastSchemas'
import { pushBroadcastActions } from '@/features/settings/basic/store/pushBroadcastSlice'

const FORM_ID = 'push-broadcast-form'

const EMPTY_FORM: PushBroadcastFormValues = {
  title: '',
  body: '',
  href: '',
}

export function PushBroadcastPanel() {
  const { t } = useTranslation('settings')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { targets, targetsStatus, targetsError, broadcastStatus, broadcastError, lastResult } =
    useAppSelector((s) => s.pushBroadcast)

  const [form, setForm] = useState<PushBroadcastFormValues>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const loadingTargets = targetsStatus === 'loading' && !targets
  usePlatformLoading(loadingTargets ? t('pushBroadcast.loading') : null)

  useEffect(() => {
    dispatch(pushBroadcastActions.loadTargetsRequested())
  }, [dispatch])

  useEffect(() => {
    if (broadcastStatus !== 'success' || !lastResult) return
    toast({
      title: t('pushBroadcast.toastSent', {
        count: lastResult.notificationsCreated,
        devices: lastResult.deviceCount,
      }),
    })
    dispatch(pushBroadcastActions.resetBroadcastStatus())
    dispatch(pushBroadcastActions.loadTargetsRequested({ force: true }))
    setForm(EMPTY_FORM)
    setConfirmOpen(false)
  }, [broadcastStatus, dispatch, lastResult, t, toast])

  useEffect(() => {
    if (broadcastStatus !== 'error' || !broadcastError) return
    toast({
      title: t('pushBroadcast.toastFailed'),
      description: broadcastError,
      variant: 'destructive',
    })
    dispatch(pushBroadcastActions.resetBroadcastStatus())
    setConfirmOpen(false)
  }, [broadcastError, broadcastStatus, dispatch, t, toast])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = pushBroadcastFormSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(
        mapZodIssuesToFieldErrors(
          parsed.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        ),
      )
      return
    }
    setFieldErrors({})
    setConfirmOpen(true)
  }

  function handleConfirmSend() {
    const parsed = pushBroadcastFormSchema.safeParse(form)
    if (!parsed.success) return
    dispatch(pushBroadcastActions.broadcastRequested(parsed.data))
  }

  const sending = broadcastStatus === 'loading'
  const deviceCount = targets?.deviceCount ?? 0
  const userCount = targets?.userCount ?? 0

  if (loadingTargets) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('pushBroadcast.title')}</CardTitle>
          <CardDescription>{t('pushBroadcast.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {targetsError ? (
            <Alert variant="destructive">
              <AlertDescription>{targetsError}</AlertDescription>
            </Alert>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {t('pushBroadcast.targetsSummary', { devices: deviceCount, users: userCount })}
          </p>

          <Form id={FORM_ID} onSubmit={handleSubmit} className="max-w-xl space-y-4">
            <FormField
              label={t('pushBroadcast.fields.title')}
              htmlFor="push-broadcast-title"
              required
              error={fieldErrors.title}
            >
              <Input
                id="push-broadcast-title"
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                maxLength={255}
                autoComplete="off"
              />
            </FormField>

            <FormField
              label={t('pushBroadcast.fields.body')}
              htmlFor="push-broadcast-body"
              error={fieldErrors.body}
            >
              <Textarea
                id="push-broadcast-body"
                value={form.body ?? ''}
                onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
                rows={4}
                maxLength={4000}
              />
            </FormField>

            <FormField
              label={t('pushBroadcast.fields.href')}
              htmlFor="push-broadcast-href"
              error={fieldErrors.href}
            >
              <Input
                id="push-broadcast-href"
                value={form.href ?? ''}
                onChange={(e) => setForm((current) => ({ ...current, href: e.target.value }))}
                placeholder="/settings/basic"
                maxLength={512}
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('pushBroadcast.fields.hrefHelp')}</p>
            </FormField>

            <Button
              type="submit"
              className="h-10"
              disabled={sending || deviceCount === 0}
            >
              <Send className="mr-2 h-4 w-4" aria-hidden />
              {t('pushBroadcast.send')}
            </Button>
          </Form>
        </CardContent>
      </Card>

      <PlatformAlertConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('pushBroadcast.confirmTitle')}
        description={t('pushBroadcast.confirmDescription', {
          devices: deviceCount,
          users: userCount,
          title: form.title.trim(),
        })}
        submitLabel={t('pushBroadcast.confirmSend')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        onConfirm={handleConfirmSend}
      />
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToastProvider,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { sendActions } from '@/features/send/store'
import { templatesActions } from '@/features/templates/store'
import { testEmailSchema, type TestEmailFormValues } from '../schemas/testSchemas'

function TestEmailForm() {
  const { t } = useTranslation('shell')
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items: templates, listStatus, listError } = useAppSelector((s) => s.templates)
  const { testStatus, testError } = useAppSelector((s) => s.send)
  const { toast } = useToast()

  const [values, setValues] = useState<TestEmailFormValues>({
    templateSlug: '',
    toEmail: user?.email ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TestEmailFormValues, string>>>({})
  const lastTestStatus = useRef(testStatus)

  const loading = listStatus === 'loading' && templates.length === 0
  const submitting = testStatus === 'sending'
  const activeTemplates = templates.filter((t) => t.isActive)

  usePlatformLoading(loading ? t('test.loading') : null)

  useEffect(() => {
    dispatch(templatesActions.loadListRequested())
  }, [dispatch])

  useEffect(() => {
    if (user?.email && !values.toEmail) {
      setValues((prev) => ({ ...prev, toEmail: user.email }))
    }
  }, [user?.email, values.toEmail])

  useEffect(() => {
    if (lastTestStatus.current === 'sending' && testStatus === 'idle') {
      toast({
        title: t('test.toastQueued'),
        description: t('test.toastQueuedDescription', { email: values.toEmail }),
      })
    }
    if (testError) {
      toast({ title: t('test.toastFailed'), description: testError, variant: 'destructive' })
    }
    lastTestStatus.current = testStatus
  }, [t, testError, testStatus, toast, values.toEmail])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = testEmailSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    dispatch(sendActions.sendTestEmailRequested(result.data))
  }

  return (
    <>
      {listError || testError ? (
        <Alert variant="destructive">
          <AlertDescription>{listError ?? testError}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <Form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          <FormField
            label={t('test.template')}
            htmlFor="test-template"
            required
            error={fieldErrors.templateSlug}
          >
            <Select
              value={values.templateSlug}
              onValueChange={(templateSlug) => setValues((prev) => ({ ...prev, templateSlug }))}
            >
              <SelectTrigger id="test-template">
                <SelectValue placeholder={t('test.selectTemplate')} />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.slug}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label={t('test.recipientEmail')}
            htmlFor="test-to"
            required
            error={fieldErrors.toEmail}
          >
            <Input
              id="test-to"
              type="email"
              value={values.toEmail}
              onChange={(e) => setValues((prev) => ({ ...prev, toEmail: e.target.value }))}
            />
          </FormField>

          <Button type="submit" disabled={submitting}>
            {submitting ? t('test.sending') : t('test.send')}
          </Button>
        </Form>
      ) : null}
    </>
  )
}

export function TestEmailPage() {
  const { t } = useTranslation('shell')
  return (
    <ToastProvider>
      <FeaturePage title={t('testTitle')} description={t('testDescription')}>
        <TestEmailForm />
      </FeaturePage>
    </ToastProvider>
  )
}

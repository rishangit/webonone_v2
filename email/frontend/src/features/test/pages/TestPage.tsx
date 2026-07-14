import { useEffect, useRef, useState } from 'react'
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

  usePlatformLoading(loading ? 'Loading test page…' : null)

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
      toast({ title: 'Test email queued', description: `Sending to ${values.toEmail}` })
    }
    if (testError) {
      toast({ title: 'Test send failed', description: testError, variant: 'destructive' })
    }
    lastTestStatus.current = testStatus
  }, [testError, testStatus, toast, values.toEmail])

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
          <FormField label="Template" htmlFor="test-template" required error={fieldErrors.templateSlug}>
            <Select
              value={values.templateSlug}
              onValueChange={(templateSlug) => setValues((prev) => ({ ...prev, templateSlug }))}
            >
              <SelectTrigger id="test-template">
                <SelectValue placeholder="Select template" />
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

          <FormField label="Recipient email" htmlFor="test-to" required error={fieldErrors.toEmail}>
            <Input
              id="test-to"
              type="email"
              value={values.toEmail}
              onChange={(e) => setValues((prev) => ({ ...prev, toEmail: e.target.value }))}
            />
          </FormField>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send test email'}
          </Button>
        </Form>
      ) : null}
    </>
  )
}

export function TestEmailPage() {
  return (
    <ToastProvider>
      <FeaturePage
        title="Test email"
        description="Send a test message using a template to verify delivery."
      >
        <TestEmailForm />
      </FeaturePage>
    </ToastProvider>
  )
}

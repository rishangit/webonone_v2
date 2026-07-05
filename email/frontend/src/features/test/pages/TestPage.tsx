import { useEffect, useState } from 'react'
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
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { emailApi } from '@/shared/services/emailApi'
import type { EmailTemplate } from '@/shared/types/email.types'
import { testEmailSchema, type TestEmailFormValues } from '../schemas/testSchemas'

function TestEmailForm() {
  const { user } = useAppSelector((s) => s.auth)
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [values, setValues] = useState<TestEmailFormValues>({
    templateSlug: '',
    toEmail: user?.email ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TestEmailFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  usePlatformLoading(loading ? 'Loading test page…' : null)

  useEffect(() => {
    if (user?.email && !values.toEmail) {
      setValues((prev) => ({ ...prev, toEmail: user.email }))
    }
  }, [user?.email, values.toEmail])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await emailApi.listTemplates()
        setTemplates(data.filter((t) => t.isActive))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = testEmailSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    setError(null)

    try {
      await emailApi.sendTestEmail(result.data)
      toast({ title: 'Test email queued', description: `Sending to ${result.data.toEmail}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test send failed'
      setError(message)
      toast({ title: 'Test send failed', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
                {templates.map((template) => (
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

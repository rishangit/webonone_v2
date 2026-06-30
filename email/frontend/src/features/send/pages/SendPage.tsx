import { useEffect, useMemo, useState } from 'react'
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
  Spinner,
} from '@webonone/ui-kit'
import { emailApi } from '@/shared/services/emailApi'
import type { EmailTemplate } from '@/shared/types/email.types'
import { sendEmailSchema, type SendEmailFormValues } from '../schemas/sendSchemas'

export function SendEmailPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [values, setValues] = useState<SendEmailFormValues>({
    templateSlug: '',
    toEmail: '',
    payload: {},
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SendEmailFormValues | 'payload', string>>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.slug === values.templateSlug) ?? null,
    [templates, values.templateSlug],
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await emailApi.listTemplates()
        const active = data.filter((t) => t.isActive)
        setTemplates(active)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (!selectedTemplate) return
    const nextPayload: Record<string, string> = { ...values.payload }
    for (const key of selectedTemplate.requiredKeys) {
      if (nextPayload[key] === undefined) {
        nextPayload[key] = ''
      }
    }
    setValues((prev) => ({ ...prev, payload: nextPayload }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset payload keys when template changes
  }, [selectedTemplate?.id])

  function patchPayload(key: string, value: string) {
    setValues((prev) => ({
      ...prev,
      payload: { ...prev.payload, [key]: value },
    }))
  }

  async function handlePreview() {
    if (!selectedTemplate) {
      setError('Select a template first')
      return
    }
    setPreviewing(true)
    setError(null)
    setPreviewHtml(null)
    try {
      const result = await emailApi.previewTemplate(selectedTemplate.id, values.payload)
      setPreviewHtml(result.html)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = sendEmailSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await emailApi.sendEmail(result.data)
      setSuccess(`Email queued (${response.queueId}).`)
      setPreviewHtml(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FeaturePage
      title="Send email"
      description="Compose a one-off transactional email using a template."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : null}

      {!loading ? (
        <Form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          <FormField label="Template" htmlFor="send-template" required error={fieldErrors.templateSlug}>
            <Select
              value={values.templateSlug}
              onValueChange={(templateSlug) => setValues((prev) => ({ ...prev, templateSlug }))}
            >
              <SelectTrigger id="send-template">
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

          <FormField label="Recipient email" htmlFor="send-to" required error={fieldErrors.toEmail}>
            <Input
              id="send-to"
              type="email"
              value={values.toEmail}
              onChange={(e) => setValues((prev) => ({ ...prev, toEmail: e.target.value }))}
            />
          </FormField>

          {selectedTemplate?.requiredKeys.map((key) => (
            <FormField key={key} label={key} htmlFor={`send-payload-${key}`} required>
              <Input
                id={`send-payload-${key}`}
                value={values.payload[key] ?? ''}
                onChange={(e) => patchPayload(key, e.target.value)}
              />
            </FormField>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void handlePreview()} disabled={previewing}>
              {previewing ? 'Previewing…' : 'Preview'}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Confirm send'}
            </Button>
          </div>
        </Form>
      ) : null}

      {previewHtml ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Preview</h2>
          <iframe
            title="Send preview"
            className="h-[360px] w-full rounded-lg border border-border bg-background"
            sandbox=""
            srcDoc={previewHtml}
          />
        </section>
      ) : null}
    </FeaturePage>
  )
}

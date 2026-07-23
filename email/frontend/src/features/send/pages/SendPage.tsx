import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { sendActions } from '@/features/send/store'
import { templatesActions } from '@/features/templates/store'
import { sendEmailSchema, type SendEmailFormValues } from '../schemas/sendSchemas'

export function SendEmailPage() {
  const dispatch = useAppDispatch()
  const { items: templates, listStatus, listError } = useAppSelector((s) => s.templates)
  const {
    sendStatus,
    sendError,
    sendSuccess,
    preview,
    previewStatus,
    previewError,
  } = useAppSelector((s) => s.send)

  const [values, setValues] = useState<SendEmailFormValues>({
    templateSlug: '',
    toEmail: '',
    payload: {},
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SendEmailFormValues | 'payload', string>>
  >({})

  const loading = listStatus === 'loading' && templates.length === 0
  const submitting = sendStatus === 'sending'
  const previewing = previewStatus === 'loading'
  const error = listError ?? sendError ?? previewError

  usePlatformLoading(loading ? 'Loading send form…' : null)

  const activeTemplates = useMemo(() => templates.filter((t) => t.isActive), [templates])

  const selectedTemplate = useMemo(
    () => activeTemplates.find((t) => t.slug === values.templateSlug) ?? null,
    [activeTemplates, values.templateSlug],
  )

  useEffect(() => {
    dispatch(templatesActions.loadListRequested())
  }, [dispatch])

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

  function handlePreview() {
    if (!selectedTemplate) return
    dispatch(
      sendActions.previewRequested({ id: selectedTemplate.id, payload: values.payload }),
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = sendEmailSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    dispatch(sendActions.sendEmailRequested(result.data))
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
      {sendSuccess ? (
        <Alert>
          <AlertDescription>{sendSuccess}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <Form onSubmit={handleSubmit} className="space-y-0">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compose</CardTitle>
                <CardDescription>Choose a template, recipient, and payload values.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Template"
                  htmlFor="send-template"
                  required
                  error={fieldErrors.templateSlug}
                >
                  <Select
                    value={values.templateSlug}
                    onValueChange={(templateSlug) =>
                      setValues((prev) => ({ ...prev, templateSlug }))
                    }
                  >
                    <SelectTrigger id="send-template">
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

                <FormField
                  label="Recipient email"
                  htmlFor="send-to"
                  required
                  error={fieldErrors.toEmail}
                >
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewing}
                  >
                    {previewing ? 'Previewing…' : 'Preview'}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Confirm send'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>Rendered HTML from the selected template.</CardDescription>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <iframe
                    title="Send preview"
                    className="h-[360px] w-full rounded-lg border border-border bg-background"
                    sandbox=""
                    srcDoc={preview.html}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click Preview to render the email here.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </Form>
      ) : null}
    </FeaturePage>
  )
}

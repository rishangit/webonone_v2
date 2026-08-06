import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
  FeaturePage,
  Form,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { sendActions } from '@/features/send/store'
import { templatesActions } from '@/features/templates/store'
import { estimateSegments } from '@/shared/utils/smsSegments'
import { sendSmsSchema, type SendSmsFormValues } from '../schemas/sendSchemas'

type SendMode = 'template' | 'freeform'

export function SendPage() {
  const { t } = useTranslation('send')
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { items: templates, listStatus, listError } = useAppSelector((s) => s.templates)
  const { sendStatus, sendError, sendSuccess, preview, previewStatus, previewError } =
    useAppSelector((s) => s.send)

  const [mode, setMode] = useState<SendMode>('template')
  const [templateSlug, setTemplateSlug] = useState('')
  const [toNumber, setToNumber] = useState('')
  const [payload, setPayload] = useState<Record<string, string>>({})
  const [body, setBody] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const loading = listStatus === 'loading' && templates.length === 0
  const submitting = sendStatus === 'sending'
  const previewing = previewStatus === 'loading'
  const error = listError ?? sendError ?? previewError

  usePlatformLoading(loading ? t('loading') : null)

  const activeTemplates = useMemo(() => templates.filter((t) => t.isActive), [templates])
  const selectedTemplate = useMemo(
    () => activeTemplates.find((t) => t.slug === templateSlug) ?? null,
    [activeTemplates, templateSlug],
  )

  const freeformInfo = useMemo(() => estimateSegments(body), [body])

  useEffect(() => {
    if (!accessToken) return
    dispatch(templatesActions.loadListRequested())
  }, [accessToken, dispatch])

  useEffect(() => {
    if (!selectedTemplate) return
    setPayload((prev) => {
      const next: Record<string, string> = { ...prev }
      for (const key of selectedTemplate.requiredKeys) {
        if (next[key] === undefined) next[key] = ''
      }
      return next
    })
  }, [selectedTemplate])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function patchPayload(key: string, value: string) {
    setPayload((prev) => ({ ...prev, [key]: value }))
  }

  function handlePreview() {
    if (!selectedTemplate) return
    dispatch(sendActions.previewRequested({ id: selectedTemplate.id, payload }))
  }

  function buildValues(): SendSmsFormValues {
    if (mode === 'template') {
      return { mode: 'template', templateSlug, toNumber, payload }
    }
    return { mode: 'freeform', toNumber, body }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = sendSmsSchema.safeParse(buildValues())
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    const data = result.data
    if (data.mode === 'template') {
      dispatch(
        sendActions.sendSmsRequested({
          toNumber: data.toNumber,
          templateSlug: data.templateSlug,
          payload: data.payload,
        }),
      )
    } else {
      dispatch(sendActions.sendSmsRequested({ toNumber: data.toNumber, body: data.body }))
    }
  }

  return (
    <FeaturePage
      title={t('title')}
      description={t('description')}
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
                <CardDescription>
                  Choose template or freeform, recipient, and message values.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Mode" htmlFor="send-mode">
                  <Select value={mode} onValueChange={(value) => setMode(value as SendMode)}>
                    <SelectTrigger id="send-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="freeform">Freeform</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Recipient number"
                  htmlFor="send-to"
                  required
                  error={fieldErrors.toNumber}
                >
                  <Input
                    id="send-to"
                    type="tel"
                    placeholder="+94771234567"
                    value={toNumber}
                    onChange={(e) => setToNumber(e.target.value)}
                  />
                </FormField>

                {mode === 'template' ? (
                  <>
                    <FormField
                      label="Template"
                      htmlFor="send-template"
                      required
                      error={fieldErrors.templateSlug}
                    >
                      <Select value={templateSlug} onValueChange={setTemplateSlug}>
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

                    {selectedTemplate?.requiredKeys.map((key) => (
                      <FormField key={key} label={key} htmlFor={`send-payload-${key}`} required>
                        <Input
                          id={`send-payload-${key}`}
                          value={payload[key] ?? ''}
                          onChange={(e) => patchPayload(key, e.target.value)}
                        />
                      </FormField>
                    ))}
                  </>
                ) : (
                  <FormField label="Message" htmlFor="send-body" required error={fieldErrors.body}>
                    <Textarea
                      id="send-body"
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {freeformInfo.chars} chars · {freeformInfo.segments} segment(s) ·{' '}
                      {freeformInfo.encoding}
                    </p>
                  </FormField>
                )}

                <div className="flex flex-wrap gap-2">
                  {mode === 'template' ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                      disabled={previewing || !selectedTemplate}
                    >
                      {previewing ? 'Previewing…' : 'Preview'}
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Confirm send'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>Rendered message from the selected template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {preview ? (
                  <>
                    <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm">
                      {preview.body}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {preview.chars} chars · {preview.segments} segment(s) · {preview.encoding}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {mode === 'template'
                      ? 'Click Preview to render the SMS here.'
                      : 'Preview is available for template messages.'}
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

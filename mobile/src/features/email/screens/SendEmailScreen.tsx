import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  Muted,
  NativeSelect,
  Spinner,
  Subheading,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { z } from 'zod'
import { EmailHtmlPreview } from '@/features/email/components/EmailHtmlPreview'
import { emailAdminApi, type EmailAdminTemplate } from '@/shared/services/emailAdminApi'

const sendSchema = z.object({
  templateSlug: z.string().min(1, 'Template is required'),
  toEmail: z.string().min(1, 'Recipient email is required').email('Enter a valid email'),
  payload: z.record(z.string()),
})

export function SendEmailScreen() {
  const { t } = useTranslation('emailSend')
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailAdminTemplate[]>([])
  const [templateSlug, setTemplateSlug] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [payload, setPayload] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<{ subject: string; html: string; text: string } | null>(
    null,
  )
  const [fieldErrors, setFieldErrors] = useState<{
    templateSlug?: string
    toEmail?: string
  }>({})
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeTemplates = useMemo(
    () => templates.filter((item) => item.isActive),
    [templates],
  )

  const selectedTemplate = useMemo(
    () => activeTemplates.find((item) => item.slug === templateSlug) ?? null,
    [activeTemplates, templateSlug],
  )

  useEffect(() => {
    let active = true
    void emailAdminApi
      .listTemplates()
      .then((items) => {
        if (active) setTemplates(items)
      })
      .catch((err: unknown) => {
        if (active) {
          setTemplates([])
          setError(err instanceof Error ? err.message : 'Failed to load templates')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedTemplate) {
      setPayload({})
      setPreview(null)
      return
    }
    const nextPayload: Record<string, string> = { ...payload }
    for (const key of selectedTemplate.requiredKeys) {
      if (nextPayload[key] === undefined) {
        nextPayload[key] = ''
      }
    }
    setPayload(nextPayload)
    setPreview(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset payload keys when template changes
  }, [selectedTemplate?.id])

  async function handlePreview() {
    if (!selectedTemplate) return
    setPreviewing(true)
    setError(null)
    try {
      const result = await emailAdminApi.previewTemplate(selectedTemplate.id, payload)
      setPreview(result)
    } catch (err) {
      setPreview(null)
      const message = err instanceof Error ? err.message : 'Preview failed'
      setError(message)
      toast({
        title: 'Preview failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setPreviewing(false)
    }
  }

  async function handleSend() {
    const parsed = sendSchema.safeParse({ templateSlug, toEmail, payload })
    if (!parsed.success) {
      const next: { templateSlug?: string; toEmail?: string } = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'templateSlug' || key === 'toEmail') {
          next[key] = issue.message
        }
      }
      setFieldErrors(next)
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    setError(null)
    try {
      await emailAdminApi.sendEmail(parsed.data)
      toast({ title: 'Email queued' })
      setToEmail('')
      setPreview(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send email'
      setError(message)
      toast({
        title: 'Failed to send email',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FeatureScreen
      title={t('title')}
      description={t('description')}
    >
      {loading ? <Spinner label={t('loading')} /> : null}
      {error ? <Body className="text-destructive">{error}</Body> : null}

      {!loading ? (
        <View className="gap-6">
          <Card className="gap-4">
            <View className="gap-1">
              <Subheading>{t('compose')}</Subheading>
              <Muted>{t('composeDescription')}</Muted>
            </View>

            <NativeSelect
              label={t('template')}
              required
              value={templateSlug}
              onValueChange={setTemplateSlug}
              options={activeTemplates.map((template) => ({
                value: template.slug,
                label: template.name,
              }))}
              placeholder={t('selectTemplate')}
              allowEmpty
              error={fieldErrors.templateSlug}
            />
            <TextField
              label={t('recipientEmail')}
              required
              keyboardType="email-address"
              autoComplete="email"
              value={toEmail}
              onChangeText={setToEmail}
              error={fieldErrors.toEmail}
              placeholder="recipient@example.com"
            />
            {selectedTemplate?.requiredKeys.map((key) => (
              <TextField
                key={key}
                label={key}
                required
                value={payload[key] ?? ''}
                onChangeText={(value) => setPayload((prev) => ({ ...prev, [key]: value }))}
              />
            ))}
            <View className="flex-row flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                loading={previewing}
                disabled={!selectedTemplate}
                onPress={() => void handlePreview()}
              >
                {previewing ? t('previewing') : t('preview')}
              </Button>
              <Button size="sm" loading={submitting} onPress={() => void handleSend()}>
                {submitting ? t('sending') : t('submit')}
              </Button>
            </View>
          </Card>

          <Card className="gap-4">
            <View className="gap-1">
              <Subheading>{t('previewTitle')}</Subheading>
              <Muted>{t('previewDescription')}</Muted>
            </View>

            {previewing ? <Spinner label={t('previewing')} /> : null}

            {!previewing && preview ? (
              <View className="gap-3">
                <TextField label="Subject" value={preview.subject} editable={false} />
                <EmailHtmlPreview html={preview.html} title={t('previewIframeTitle')} />
              </View>
            ) : null}

            {!previewing && !preview ? (
              <Muted>{t('previewHint')}</Muted>
            ) : null}
          </Card>
        </View>
      ) : null}
    </FeatureScreen>
  )
}

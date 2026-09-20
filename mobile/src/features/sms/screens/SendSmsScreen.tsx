import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  Muted,
  Spinner,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { smsAdminApi, type SmsAdminTemplate } from '@/shared/services/smsAdminApi'

const sendSchema = z.object({
  toNumber: z
    .string()
    .min(1, 'Recipient number is required')
    .regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number'),
  body: z.string().min(1, 'Message body is required').max(1600, 'Message is too long'),
})

export function SendSmsScreen() {
  const { t } = useTranslation('smsSend')
  const { toast } = useToast()
  const [toNumber, setToNumber] = useState('')
  const [body, setBody] = useState('')
  const [templates, setTemplates] = useState<SmsAdminTemplate[]>([])
  const [templateSlug, setTemplateSlug] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ toNumber?: string; body?: string }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    void smsAdminApi
      .listTemplates()
      .then((items) => {
        if (active) setTemplates(items.filter((item) => item.isActive))
      })
      .catch(() => {
        if (active) setTemplates([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function applyTemplate(slug: string) {
    const template = templates.find((item) => item.slug === slug)
    setTemplateSlug(slug)
    if (template) setBody(template.body)
  }

  async function handleSend() {
    const parsed = sendSchema.safeParse({ toNumber, body })
    if (!parsed.success) {
      const next: { toNumber?: string; body?: string } = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'toNumber' || key === 'body') next[key] = issue.message
      }
      setFieldErrors(next)
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    try {
      await smsAdminApi.sendSms({
        toNumber: parsed.data.toNumber,
        body: parsed.data.body,
        templateSlug: templateSlug ?? undefined,
      })
      toast({ title: t('queued', { queueId: '—' }) })
      setBody('')
    } catch (err) {
      toast({
        title: 'Failed to send SMS',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FeatureScreen title={t('title')} description={t('description')}>
      {loading ? <Spinner label={t('loading')} /> : null}
      {templates.length > 0 ? (
        <Card className="gap-2">
          <Muted>{t('template')}</Muted>
          <View className="flex-row flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                size="sm"
                variant={templateSlug === template.slug ? 'default' : 'outline'}
                onPress={() => applyTemplate(template.slug)}
              >
                {template.name}
              </Button>
            ))}
          </View>
        </Card>
      ) : null}
      <Card className="gap-4">
        <TextField
          label={t('recipientNumber')}
          required
          keyboardType="phone-pad"
          value={toNumber}
          onChangeText={setToNumber}
          error={fieldErrors.toNumber}
          placeholder="+94…"
        />
        <TextField
          label={t('message')}
          required
          multiline
          numberOfLines={4}
          value={body}
          onChangeText={setBody}
          error={fieldErrors.body}
        />
        <Button loading={submitting} onPress={() => void handleSend()}>
          {submitting ? t('sending') : t('submit')}
        </Button>
      </Card>
      <Body className="text-sm text-muted">
        Delivery uses this phone (This device) or Text.lk, depending on Devices → Settings on the web.
      </Body>
    </FeatureScreen>
  )
}

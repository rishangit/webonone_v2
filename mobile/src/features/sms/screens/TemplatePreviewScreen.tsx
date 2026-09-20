import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  Spinner,
  Subheading,
  Textarea,
  useToast,
} from '@webonone/mobile-ui'
import { smsAdminApi, type SmsAdminTemplate, type SmsTemplatePreview } from '@/shared/services/smsAdminApi'

function buildSamplePayload(template: SmsAdminTemplate): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const key of template.requiredKeys) {
    payload[key] = `sample_${key}`
  }
  return payload
}

export function TemplatePreviewScreen({ templateId }: { templateId: string }) {
  const { t } = useTranslation('smsTemplates')
  const router = useRouter()
  const { toast } = useToast()

  const [template, setTemplate] = useState<SmsAdminTemplate | null>(null)
  const [payloadJson, setPayloadJson] = useState('{}')
  const [preview, setPreview] = useState<SmsTemplatePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await smsAdminApi.getTemplate(templateId)
      setTemplate(data)
      setPayloadJson(JSON.stringify(buildSamplePayload(data), null, 2))
    } catch (err) {
      setTemplate(null)
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!template) return
    void handleRender()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial render when template loads
  }, [template?.id])

  async function handleRender() {
    if (!template) return
    let payload: Record<string, string>
    try {
      payload = JSON.parse(payloadJson) as Record<string, string>
    } catch {
      toast({
        title: 'Invalid JSON payload',
        description: 'Fix the sample payload before rendering.',
        variant: 'destructive',
      })
      return
    }
    setRendering(true)
    setError(null)
    try {
      setPreview(await smsAdminApi.previewTemplate(template.id, payload))
    } catch (err) {
      setPreview(null)
      setError(err instanceof Error ? err.message : 'Failed to render preview')
    } finally {
      setRendering(false)
    }
  }

  if (loading) {
    return (
      <FeatureScreen title={t('preview')} onBack={() => router.back()}>
        <Spinner label="Loading template…" />
      </FeatureScreen>
    )
  }

  if (!template) {
    return (
      <FeatureScreen title={t('preview')} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? 'Template not found.'}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={`Preview — ${template.name}`}
      description="Render the template with a sample payload."
      onBack={() => router.back()}
    >
      {error ? <Body className="text-destructive">{error}</Body> : null}

      <Card className="gap-4">
        <Textarea
          label="Sample payload (JSON)"
          numberOfLines={10}
          value={payloadJson}
          onChangeText={setPayloadJson}
          autoCapitalize="none"
        />
        <Button loading={rendering} onPress={() => void handleRender()}>
          Render
        </Button>
      </Card>

      {preview ? (
        <Card className="gap-3">
          <Subheading>Rendered message</Subheading>
          <Body className="whitespace-pre-wrap">{preview.body}</Body>
          <MutedSegmentInfo preview={preview} />
        </Card>
      ) : null}
    </FeatureScreen>
  )
}

function MutedSegmentInfo({ preview }: { preview: SmsTemplatePreview }) {
  return (
    <Body className="text-xs text-muted-foreground">
      {preview.chars} chars · {preview.segments} segment{preview.segments === 1 ? '' : 's'} ·{' '}
      {preview.encoding}
    </Body>
  )
}


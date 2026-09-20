import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  Spinner,
  Subheading,
  Textarea,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { emailAdminApi, type EmailAdminTemplate, type EmailTemplatePreview } from '@/shared/services/emailAdminApi'

function buildSamplePayload(template: EmailAdminTemplate): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const key of template.requiredKeys) {
    payload[key] = `sample_${key}`
  }
  return payload
}

export function TemplatePreviewScreen({ templateId }: { templateId: string }) {
  const { t } = useTranslation('emailTemplates')
  const router = useRouter()
  const { toast } = useToast()

  const [template, setTemplate] = useState<EmailAdminTemplate | null>(null)
  const [payloadJson, setPayloadJson] = useState('{}')
  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await emailAdminApi.getTemplate(templateId)
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
      setPreview(await emailAdminApi.previewTemplate(template.id, payload))
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
        <TextField label="Rendered subject" value={preview?.subject ?? ''} editable={false} />
        <Button loading={rendering} onPress={() => void handleRender()}>
          Render
        </Button>
      </Card>

      {preview ? (
        <Card className="gap-3">
          <Subheading>Plain text</Subheading>
          <Body>{preview.text}</Body>
          <Subheading>HTML</Subheading>
          <View className="rounded-lg border border-border bg-muted/30 p-3">
            <Body className="font-mono text-xs">{preview.html}</Body>
          </View>
        </Card>
      ) : null}
    </FeatureScreen>
  )
}

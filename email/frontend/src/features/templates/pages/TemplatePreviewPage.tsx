import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  Input,
  LoadingState,
  Textarea,
} from '@webonone/ui-kit'
import { emailApi } from '@/shared/services/emailApi'
import type { EmailTemplate, TemplatePreviewResult } from '@/shared/types/email.types'

function buildSamplePayload(template: EmailTemplate): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const key of template.requiredKeys) {
    payload[key] = `sample_${key}`
  }
  return payload
}

export function TemplatePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [payloadJson, setPayloadJson] = useState('{}')
  const [preview, setPreview] = useState<TemplatePreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    if (!id) return
    const templateId = id

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const tpl = await emailApi.getTemplate(templateId)
        setTemplate(tpl)
        setPayloadJson(JSON.stringify(buildSamplePayload(tpl), null, 2))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id])

  async function handleRender() {
    if (!id) return
    setRendering(true)
    setError(null)
    try {
      const payload = JSON.parse(payloadJson) as Record<string, string>
      const result = await emailApi.previewTemplate(id, payload)
      setPreview(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to render preview. Check sample payload JSON.',
      )
      setPreview(null)
    } finally {
      setRendering(false)
    }
  }

  useEffect(() => {
    if (!template || !id) return
    void handleRender()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial render when template loads
  }, [template?.id])

  return (
    <FeaturePage
      title={template ? `Preview: ${template.name}` : 'Template preview'}
      description="Render the template with sample payload and branding."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/templates">Back</Link>
          </Button>
          {id ? (
            <Button type="button" variant="outline" asChild>
              <Link to={`/templates/${id}`}>Edit</Link>
            </Button>
          ) : null}
        </div>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <LoadingState overlay label="Loading preview…" /> : null}

      {!loading && template ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField label="Sample payload (JSON)" htmlFor="preview-payload">
              <Textarea
                id="preview-payload"
                rows={10}
                value={payloadJson}
                onChange={(e) => setPayloadJson(e.target.value)}
              />
            </FormField>
            <div className="space-y-2">
              <FormField label="Rendered subject" htmlFor="preview-subject">
                <Input id="preview-subject" readOnly value={preview?.subject ?? ''} />
              </FormField>
              <Button type="button" onClick={() => void handleRender()} disabled={rendering}>
                {rendering ? 'Rendering…' : 'Render preview'}
              </Button>
            </div>
          </div>

          {preview ? (
            <section className="space-y-2">
              <h2 className="text-lg font-medium">HTML preview</h2>
              <iframe
                title="Email HTML preview"
                className="h-[480px] w-full rounded-lg border border-border bg-background"
                sandbox=""
                srcDoc={preview.html}
              />
              <h2 className="text-lg font-medium">Plain text</h2>
              <pre className="whitespace-pre-wrap rounded-lg border border-border p-4 text-sm">
                {preview.text}
              </pre>
            </section>
          ) : null}
        </div>
      ) : null}
    </FeaturePage>
  )
}

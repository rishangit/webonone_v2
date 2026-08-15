import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  Input,
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'
import type { EmailTemplate } from '@/shared/types/email.types'

function buildSamplePayload(template: EmailTemplate): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const key of template.requiredKeys) {
    payload[key] = `sample_${key}`
  }
  return payload
}

export function TemplatePreviewPage() {
  const { t } = useTranslation('templates')
  const { t: tc } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const {
    detail: template,
    detailStatus,
    detailError,
    preview,
    previewStatus,
    previewError,
  } = useAppSelector((s) => s.templates)
  const [payloadJson, setPayloadJson] = useState('{}')

  const loading = detailStatus === 'loading' && !template
  const rendering = previewStatus === 'loading'
  const error = detailError ?? previewError

  usePlatformLoading(loading ? t('previewPage.loading') : null)

  useEffect(() => {
    if (!id) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
  }, [dispatch, id])

  useEffect(() => {
    if (!template) return
    setPayloadJson(JSON.stringify(buildSamplePayload(template), null, 2))
  }, [template])

  useEffect(() => {
    if (!template || !id) return
    try {
      const payload = JSON.parse(payloadJson) as Record<string, string>
      dispatch(templatesActions.previewRequested({ id, payload }))
    } catch {
      // invalid JSON — user must fix before render
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial render when template loads
  }, [template?.id])

  function handleRender() {
    if (!id) return
    try {
      const payload = JSON.parse(payloadJson) as Record<string, string>
      dispatch(templatesActions.previewRequested({ id, payload }))
    } catch {
      dispatch(templatesActions.previewFailed(t('previewPage.renderFailed')))
    }
  }

  return (
    <FeaturePage
      title={
        template ? t('previewPage.title', { name: template.name }) : t('previewPage.titleFallback')
      }
      description={t('previewPage.description')}
      onBack={() => navigate(id ? `/templates/${id}` : '/templates')}
      backLabel={tc('back')}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && template ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField label={t('previewPage.samplePayload')} htmlFor="preview-payload">
              <Textarea
                id="preview-payload"
                rows={10}
                value={payloadJson}
                onChange={(e) => setPayloadJson(e.target.value)}
              />
            </FormField>
            <div className="space-y-2">
              <FormField label={t('previewPage.renderedSubject')} htmlFor="preview-subject">
                <Input id="preview-subject" readOnly value={preview?.subject ?? ''} />
              </FormField>
              <Button type="button" onClick={handleRender} disabled={rendering}>
                {rendering ? t('previewPage.rendering') : t('previewPage.render')}
              </Button>
            </div>
          </div>

          {preview ? (
            <section className="space-y-2">
              <h2 className="text-lg font-medium">{t('previewPage.htmlPreview')}</h2>
              <iframe
                title={t('previewPage.iframeTitle')}
                className="h-[480px] w-full rounded-lg border border-border bg-background"
                sandbox=""
                srcDoc={preview.html}
              />
              <h2 className="text-lg font-medium">{t('previewPage.plainText')}</h2>
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

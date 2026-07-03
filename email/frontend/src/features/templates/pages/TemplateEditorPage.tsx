import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  Form,
  FormField,
  Input,
  ItemList,
  ItemListContent,
  ItemListItem,
  ListEmptyState,
  Pagination,
  mapZodIssuesToFieldErrors,
  LoadingState,
  Textarea,
} from '@webonone/ui-kit'
import { emailApi } from '@/shared/services/emailApi'
import type { EmailTemplate, TemplateVersion } from '@/shared/types/email.types'
import {
  templateEditorSchema,
  type TemplateEditorFormValues,
} from '../schemas/templateSchemas'

const PLACEHOLDER_HELP = [
  '{{userName}}',
  '{{otp}}',
  '{{actionUrl}}',
  '{{companyName}}',
  '{{logoUrl}}',
  '{{primaryColor}}',
  '{{contactEmail}}',
  '{{footerHtml}}',
  '{{year}}',
]

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [values, setValues] = useState<TemplateEditorFormValues>({
    name: '',
    subject: '',
    htmlBody: '',
    textBody: '',
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof TemplateEditorFormValues, string>>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [versionPage, setVersionPage] = useState(1)
  const [versionPageSize, setVersionPageSize] = useState(12)

  const visibleVersions = versions.slice(
    (versionPage - 1) * versionPageSize,
    versionPage * versionPageSize,
  )

  useEffect(() => {
    if (!id) return
    const templateId = id

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [tpl, vers] = await Promise.all([
          emailApi.getTemplate(templateId),
          emailApi.listTemplateVersions(templateId),
        ])
        setTemplate(tpl)
        setVersions(vers)
        setVersionPage(1)
        setValues({
          name: tpl.name,
          subject: tpl.subject,
          htmlBody: tpl.htmlBody,
          textBody: tpl.textBody,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id])

  function patchValues(patch: Partial<TemplateEditorFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!id) return

    const result = templateEditorSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await emailApi.updateTemplate(id, result.data)
      setTemplate(updated)
      const vers = await emailApi.listTemplateVersions(id)
      setVersions(vers)
      setSuccess('Template saved. A new version was recorded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestoreVersion(versionId: string) {
    if (!id) return
    setRestoringId(versionId)
    setError(null)
    setSuccess(null)
    try {
      const updated = await emailApi.restoreTemplateVersion(id, versionId)
      setTemplate(updated)
      setValues({
        name: updated.name,
        subject: updated.subject,
        htmlBody: updated.htmlBody,
        textBody: updated.textBody,
      })
      const vers = await emailApi.listTemplateVersions(id)
      setVersions(vers)
      setSuccess('Version restored into the editor.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version')
    } finally {
      setRestoringId(null)
    }
  }

  if (!id) {
    return (
      <FeaturePage title="Template editor" description="Missing template id.">
        <Button type="button" variant="outline" onClick={() => navigate('/templates')}>
          Back to templates
        </Button>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={template ? `Edit: ${template.name}` : 'Template editor'}
      description="Update subject and body content. Saving creates a new version."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/templates">Back</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/templates/${id}/preview`}>Preview</Link>
          </Button>
        </div>
      }
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

      {loading ? <LoadingState label="Loading template…" /> : null}

      {!loading && template ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <Form onSubmit={handleSave} className="space-y-4">
            <FormField label="Name" htmlFor="template-name" required error={fieldErrors.name}>
              <Input
                id="template-name"
                value={values.name}
                onChange={(e) => patchValues({ name: e.target.value })}
              />
            </FormField>

            <FormField label="Subject" htmlFor="template-subject" required error={fieldErrors.subject}>
              <Input
                id="template-subject"
                value={values.subject}
                onChange={(e) => patchValues({ subject: e.target.value })}
              />
            </FormField>

            <FormField label="HTML body" htmlFor="template-html" required error={fieldErrors.htmlBody}>
              <Textarea
                id="template-html"
                rows={12}
                value={values.htmlBody}
                onChange={(e) => patchValues({ htmlBody: e.target.value })}
              />
            </FormField>

            <FormField
              label="Plain text body"
              htmlFor="template-text"
              required
              error={fieldErrors.textBody}
            >
              <Textarea
                id="template-text"
                rows={8}
                value={values.textBody}
                onChange={(e) => patchValues({ textBody: e.target.value })}
              />
            </FormField>

            <p className="text-sm text-muted-foreground">
              Allowed placeholders: {PLACEHOLDER_HELP.join(', ')}
              {template.requiredKeys.length > 0
                ? ` · Template-specific: ${template.requiredKeys.map((p) => `{{${p}}}`).join(', ')}`
                : ''}
            </p>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save template'}
            </Button>
          </Form>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Version history</h2>
            {versions.length === 0 ? (
              <ListEmptyState itemType="versions" message="No versions yet." />
            ) : (
              <div className="space-y-4">
                <ItemList>
                  {visibleVersions.map((version) => (
                    <ItemListItem key={version.id}>
                      <ItemListContent>
                        <p className="font-medium">v{version.versionNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {version.subject} · {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </ItemListContent>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={restoringId === version.id}
                        onClick={() => void handleRestoreVersion(version.id)}
                      >
                        Restore
                      </Button>
                    </ItemListItem>
                  ))}
                </ItemList>
                <Pagination
                  totalCount={versions.length}
                  currentPage={versionPage}
                  pageSize={versionPageSize}
                  pageSizeOptions={[12, 24, 48]}
                  onPageChange={setVersionPage}
                  onPageSizeChange={(nextSize) => {
                    setVersionPageSize(nextSize)
                    setVersionPage(1)
                  }}
                />
              </div>
            )}
          </section>
        </div>
      ) : null}
    </FeaturePage>
  )
}

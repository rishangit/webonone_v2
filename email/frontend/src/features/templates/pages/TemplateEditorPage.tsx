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
  ItemListEmpty,
  Pagination,
  mapZodIssuesToFieldErrors,
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'
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
  const dispatch = useAppDispatch()
  const {
    detail: template,
    detailStatus,
    detailError,
    versions,
    versionsStatus,
  } = useAppSelector((s) => s.templates)
  const [values, setValues] = useState<TemplateEditorFormValues>({
    name: '',
    subject: '',
    htmlBody: '',
    textBody: '',
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof TemplateEditorFormValues, string>>
  >({})
  const [success, setSuccess] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [versionPage, setVersionPage] = useState(1)
  const [versionPageSize, setVersionPageSize] = useState(12)
  const [awaitingSave, setAwaitingSave] = useState(false)

  const loading = detailStatus === 'loading' && !template
  const saving = detailStatus === 'saving'

  usePlatformLoading(loading ? 'Loading template…' : null)

  const visibleVersions = versions.slice(
    (versionPage - 1) * versionPageSize,
    versionPage * versionPageSize,
  )

  useEffect(() => {
    if (!id) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
    dispatch(templatesActions.loadVersionsRequested({ id }))
  }, [dispatch, id])

  useEffect(() => {
    if (!template || template.id !== id) return
    setValues({
      name: template.name,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
    })
  }, [id, template])

  useEffect(() => {
    if (awaitingSave && detailStatus === 'idle' && !detailError) {
      setSuccess('Template saved. A new version was recorded.')
      setAwaitingSave(false)
    }
    if (awaitingSave && detailStatus === 'error') {
      setAwaitingSave(false)
    }
  }, [awaitingSave, detailError, detailStatus])

  function patchValues(patch: Partial<TemplateEditorFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!id) return

    const result = templateEditorSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    setSuccess(null)
    setAwaitingSave(true)
    dispatch(templatesActions.updateRequested({ id, body: result.data }))
  }

  function handleRestoreVersion(versionId: string) {
    if (!id) return
    setRestoringId(versionId)
    setSuccess(null)
    dispatch(templatesActions.restoreVersionRequested({ id, versionId }))
  }

  useEffect(() => {
    if (restoringId && detailStatus === 'idle' && template) {
      setRestoringId(null)
      setSuccess('Version restored into the editor.')
    }
  }, [detailStatus, restoringId, template])

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
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
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
            {versionsStatus === 'loading' && versions.length === 0 ? (
              <ItemListEmpty>Loading versions…</ItemListEmpty>
            ) : versions.length === 0 ? (
              <ItemListEmpty>No versions yet.</ItemListEmpty>
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
                        onClick={() => handleRestoreVersion(version.id)}
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

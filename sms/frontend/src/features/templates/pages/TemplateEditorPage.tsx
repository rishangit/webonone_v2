import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  DropdownMenuItem,
  FeaturePage,
  Form,
  FormField,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListPageBody,
  Pagination,
  mapZodIssuesToFieldErrors,
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'
import { estimateSegments } from '@/shared/utils/smsSegments'
import { templateEditorSchema, type TemplateEditorFormValues } from '../schemas/templateSchemas'

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { detail: template, detailStatus, detailError, versions, versionsStatus } = useAppSelector(
    (s) => s.templates,
  )
  const [values, setValues] = useState<TemplateEditorFormValues>({ name: '', body: '' })
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
  const versionsLoading = versionsStatus === 'loading' && versions.length === 0

  usePlatformLoading(loading ? 'Loading template…' : versionsLoading ? 'Loading versions…' : null)

  const info = useMemo(() => estimateSegments(values.body), [values.body])

  const visibleVersions = versions.slice(
    (versionPage - 1) * versionPageSize,
    versionPage * versionPageSize,
  )

  useEffect(() => {
    if (!id || !accessToken) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
    dispatch(templatesActions.loadVersionsRequested({ id }))
  }, [accessToken, dispatch, id])

  useEffect(() => {
    if (!template || template.id !== id) return
    setValues({ name: template.name, body: template.body })
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

  useEffect(() => {
    if (restoringId && detailStatus === 'idle' && template) {
      setRestoringId(null)
      setSuccess('Version restored into the editor.')
    }
  }, [detailStatus, restoringId, template])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

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
      description="Update the message body. Saving creates a new version."
      actions={
        <Button type="button" variant="outline" asChild>
          <Link to="/templates">Back</Link>
        </Button>
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

            <FormField label="Message body" htmlFor="template-body" required error={fieldErrors.body}>
              <Textarea
                id="template-body"
                rows={8}
                value={values.body}
                onChange={(e) => patchValues({ body: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {info.chars} chars · {info.segments} segment(s) · {info.encoding}
              </p>
            </FormField>

            <p className="text-sm text-muted-foreground">
              Use <code>{'{{placeholder}}'}</code> for dynamic values.
              {template.requiredKeys.length > 0
                ? ` Required: ${template.requiredKeys.map((p) => `{{${p}}}`).join(', ')}`
                : ''}
            </p>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save template'}
            </Button>
          </Form>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Version history</h2>
            <ListPageBody>
              <div className="flex-1">
                {versions.length === 0 ? (
                  <ItemListEmpty>No versions yet.</ItemListEmpty>
                ) : (
                  <ItemList>
                    {visibleVersions.map((version) => (
                      <ItemListItem key={version.id}>
                        <ItemListContent>
                          <p className="font-medium">v{version.versionNumber}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {version.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                          </p>
                        </ItemListContent>
                        <ItemListMenu ariaLabel={`Actions for version ${version.versionNumber}`}>
                          <DropdownMenuItem
                            disabled={restoringId === version.id}
                            onClick={() => handleRestoreVersion(version.id)}
                          >
                            Restore
                          </DropdownMenuItem>
                        </ItemListMenu>
                      </ItemListItem>
                    ))}
                  </ItemList>
                )}
              </div>
              {versions.length > 0 ? (
                <Pagination
                  className="mt-auto"
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
              ) : null}
            </ListPageBody>
          </section>
        </div>
      ) : null}
    </FeaturePage>
  )
}

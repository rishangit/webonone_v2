import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateEmail } from '@/features/shell/utils/navigateEmail'
import { TemplateFormDialog } from '@/features/templates/components/TemplateFormDialog'
import { templatesActions } from '@/features/templates/store'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import type { UpdateTemplateBody } from '@/shared/services/emailApi'

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatScope(scope: string, isDefault?: boolean): string {
  if (isDefault) return 'Default'
  return scope === 'platform' ? 'Platform' : 'Company'
}

function truncateBody(value: string, max = 160): string {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return '—'
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function TemplateDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { goToList, goToPreview, goToVersions } = useNavigateEmail()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.templates)
  const canEdit = user?.role === 'super_admin' || user?.role === 'company_admin'
  const [editOpen, setEditOpen] = useState(false)
  const [awaitingUpdate, setAwaitingUpdate] = useState(false)

  useEffect(() => {
    if (!id) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
  }, [dispatch, id])

  const template = detail?.id === id ? detail : null
  usePlatformLoading(!template && detailStatus !== 'error' ? 'Loading template…' : null)

  useEffect(() => {
    if (!awaitingUpdate || !id) return
    if (detailStatus === 'idle' && detail && !detailError) {
      setAwaitingUpdate(false)
      setEditOpen(false)
      toast({ title: 'Template saved' })
      if (detail.id !== id) {
        navigate(`/templates/${detail.id}`, { replace: true })
      }
    }
    if (detailStatus === 'error' && detailError) {
      setAwaitingUpdate(false)
      toast({
        title: 'Failed to save template',
        description: detailError,
        variant: 'destructive',
      })
    }
  }, [awaitingUpdate, detail, detailError, detailStatus, id, navigate, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!id) return <Navigate to="/templates" replace />

  function handleUpdate(values: UpdateTemplateBody) {
    if (!id) return
    setAwaitingUpdate(true)
    dispatch(templatesActions.updateRequested({ id, body: values }))
  }

  return (
    <FeaturePage
      title={template?.name ?? 'Template'}
      description="Email template details"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goToList}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          {template ? (
            <Button type="button" variant="outline" size="sm" onClick={() => goToPreview(id)}>
              Preview
            </Button>
          ) : null}
        </div>
      }
    >
      {detailError && !awaitingUpdate ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {template ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title="Template"
              description="Name, subject, and body summary"
              canEdit={canEdit}
              onEdit={() => setEditOpen(true)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{template.name}</h2>
                <StatusTag variant={template.isActive ? 'approved' : 'rejected'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </StatusTag>
                {template.isDefault ? <StatusTag variant="pending">Default</StatusTag> : null}
              </div>
              <ReadOnlyField label="Subject" value={template.subject} />
              <ReadOnlyField
                label="HTML body"
                value={
                  <p className="line-clamp-3 break-all font-mono text-xs text-muted-foreground">
                    {truncateBody(template.htmlBody)}
                  </p>
                }
              />
              <ReadOnlyField
                label="Plain text body"
                value={
                  <p className="line-clamp-3 break-words text-muted-foreground">
                    {truncateBody(template.textBody)}
                  </p>
                }
              />
              <ReadOnlyField
                label="Required placeholders"
                value={
                  template.requiredKeys.length === 0 ? (
                    'None'
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {template.requiredKeys.map((key) => (
                        <code
                          key={key}
                          className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
                        >
                          {`{{${key}}}`}
                        </code>
                      ))}
                    </div>
                  )
                }
              />
            </EditableSectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meta</CardTitle>
                <CardDescription>Scope, slug, and timestamps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label="Slug" value={<code>{template.slug}</code>} />
                <ReadOnlyField
                  label="Scope"
                  value={formatScope(template.scope, template.isDefault)}
                />
                <ReadOnlyField label="Updated" value={formatTimestamp(template.updatedAt)} />
                {template.createdAt ? (
                  <ReadOnlyField label="Created" value={formatTimestamp(template.createdAt)} />
                ) : null}
              </CardContent>
            </Card>

            {!template.isDefault ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Versions</CardTitle>
                  <CardDescription>Restore a previous version of this template</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" size="sm" onClick={() => goToVersions(id)}>
                    Version history
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {editOpen && template ? (
        <TemplateFormDialog
          open
          mode="edit"
          template={template}
          isSaving={detailStatus === 'saving'}
          error={awaitingUpdate ? detailError : null}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setAwaitingUpdate(false)
          }}
          onCreate={() => undefined}
          onUpdate={handleUpdate}
          onHostedSaved={() => {
            setEditOpen(false)
            setAwaitingUpdate(false)
            toast({ title: 'Template saved' })
            dispatch(templatesActions.fetchDetailRequested({ id, force: true }))
            dispatch(templatesActions.loadListRequested({ force: true }))
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

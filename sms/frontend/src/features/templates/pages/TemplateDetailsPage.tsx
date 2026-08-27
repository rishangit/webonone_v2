import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useNavigateSms } from '@/features/shell/utils/navigateSms'
import { TemplateFormDialog } from '@/features/templates/components/TemplateFormDialog'
import type { TemplateEditorFormValues } from '@/features/templates/schemas/templateSchemas'
import { templatesActions } from '@/features/templates/store'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

function formatScope(
  scope: string,
  t: (key: 'scopeDefault' | 'scopePlatform' | 'scopeCompany') => string,
  isDefault?: boolean,
): string {
  if (isDefault) return t('scopeDefault')
  return scope === 'platform' ? t('scopePlatform') : t('scopeCompany')
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
  const { t } = useTranslation('templates')
  const { t: tc } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { goToList, goToPreview, goToVersions } = useNavigateSms()
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
  usePlatformLoading(!template && detailStatus !== 'error' ? t('loadingTemplate') : null)

  useEffect(() => {
    if (!awaitingUpdate || !id) return
    if (detailStatus === 'idle' && detail && !detailError) {
      setAwaitingUpdate(false)
      setEditOpen(false)
      toast({ title: t('toastSaved') })
      if (detail.id !== id) {
        navigate(`/templates/${detail.id}`, { replace: true })
      }
    }
    if (detailStatus === 'error' && detailError) {
      setAwaitingUpdate(false)
      toast({
        title: t('toastSaveFailed'),
        description: detailError,
        variant: 'destructive',
      })
    }
  }, [awaitingUpdate, detail, detailError, detailStatus, id, navigate, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!id) return <Navigate to="/templates" replace />

  function handleUpdate(values: TemplateEditorFormValues) {
    if (!id) return
    setAwaitingUpdate(true)
    dispatch(templatesActions.updateRequested({ id, body: values }))
  }

  return (
    <FeaturePage
      title={template?.name ?? t('singular')}
      description={t('pageDescription')}
      onBack={goToList}
      backLabel={tc('back')}
      actions={
        template ? (
          <Button type="button" variant="outline" size="sm" onClick={() => goToPreview(id)}>
            {t('preview')}
          </Button>
        ) : undefined
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
              title={t('singular')}
              description={t('cardDescription')}
              canEdit={canEdit}
              onEdit={() => setEditOpen(true)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{template.name}</h2>
                <StatusTag variant={template.isActive ? 'approved' : 'rejected'}>
                  {template.isActive ? t('active') : t('inactive')}
                </StatusTag>
                {template.isDefault ? <StatusTag variant="pending">{t('scopeDefault')}</StatusTag> : null}
              </div>
              <ReadOnlyField
                label={t('messageBody')}
                value={
                  <p className="line-clamp-4 break-words whitespace-pre-wrap text-muted-foreground">
                    {truncateBody(template.body, 280)}
                  </p>
                }
              />
              <ReadOnlyField
                label={t('requiredPlaceholders')}
                value={
                  template.requiredKeys.length === 0 ? (
                    tc('none')
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
                <CardTitle className="text-lg">{t('meta.title')}</CardTitle>
                <CardDescription>{t('meta.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label={t('slug')} value={<code>{template.slug}</code>} />
                <ReadOnlyField
                  label={t('scope')}
                  value={formatScope(template.scope, t, template.isDefault)}
                />
                <ReadOnlyField label={t('updated')} value={formatDisplayDateTime(template.updatedAt)} />
              </CardContent>
            </Card>

            {!template.isDefault ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('versions.title')}</CardTitle>
                  <CardDescription>{t('versions.cardDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" size="sm" onClick={() => goToVersions(id)}>
                    {t('versionHistory')}
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
            toast({ title: t('toastSaved') })
            dispatch(templatesActions.fetchDetailRequested({ id, force: true }))
            dispatch(templatesActions.loadListRequested({ force: true }))
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

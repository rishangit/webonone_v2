import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { TagFormDialog } from '@/features/tags/components/TagFormDialog'
import { tagsActions } from '@/features/tags/store'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { StatusBadge } from '@/shared/components/StatusBadge'

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function TagDetailsPage() {
  const { t } = useTranslation('tags')
  const { tagId } = useParams<{ tagId: string }>()
  const { goToList } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.tags)
  const canEdit = user?.role === 'super_admin'
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!tagId) return
    dispatch(tagsActions.fetchDetailRequested({ id: tagId }))
  }, [dispatch, tagId])

  const tag = detail?.id === tagId ? detail : null
  usePlatformLoading(
    !tag && detailStatus !== 'error' ? t('loadingDetail') : null,
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!tagId) return <Navigate to="/tags" replace />

  return (
    <FeaturePage
      title={tag?.name ?? t('singular')}
      description={t('details')}
      onBack={() => goToList('tags')}
      backLabel={t('common:back')}
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {tag ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title="Tag"
              description="Name, color, status, and description"
              canEdit={canEdit}
              onEdit={() => setEditOpen(true)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden
                />
                <h2 className="text-xl font-semibold">{tag.name}</h2>
                <StatusBadge status={tag.status} />
              </div>
              <ReadOnlyField
                label="Description"
                value={tag.description?.trim() ? tag.description : '—'}
              />
              <ReadOnlyField
                label="Color"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full border"
                      style={{ backgroundColor: tag.color }}
                      aria-hidden
                    />
                    {tag.color}
                  </span>
                }
              />
            </EditableSectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meta</CardTitle>
                <CardDescription>Record timestamps and references</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label="Created" value={formatTimestamp(tag.createdAt)} />
                <ReadOnlyField label="Updated" value={formatTimestamp(tag.updatedAt)} />
                <ReadOnlyField
                  label="References"
                  value={String(tag.referenceCount ?? 0)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {editOpen && tagId ? (
        <TagFormDialog
          open
          id={tagId}
          onOpenChange={(open) => {
            if (!open) setEditOpen(false)
          }}
          onSaved={() => {
            dispatch(tagsActions.fetchDetailRequested({ id: tagId, force: true }))
            setEditOpen(false)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

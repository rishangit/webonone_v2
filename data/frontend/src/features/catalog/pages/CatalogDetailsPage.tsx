import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
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
  TagChip,
} from '@webonone/ui-kit'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { CatalogAttributesTab } from '@/features/catalog/components/CatalogAttributesTab'
import {
  CatalogDetailSectionTabs,
  type CatalogDetailTabId,
} from '@/features/catalog/components/CatalogDetailSectionTabs'
import { CatalogFormDialog } from '@/features/catalog/components/CatalogFormDialog'
import { CatalogLibraryGalleryCard } from '@/features/catalog/components/CatalogLibraryGalleryCard'
import { spacesActions } from '@/features/spaces/store'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { CatalogFeatureState } from '@webonone/store-kit'
import type { CatalogItem } from '@/shared/types/data.types'

type CatalogDetailKind = 'spaces'

const CONFIG: Record<
  CatalogDetailKind,
  {
    listPath: string
    paramKey: 'spaceId'
    singular: string
    select: (s: RootState) => CatalogFeatureState<CatalogItem>
    actions: typeof spacesActions
  }
> = {
  spaces: {
    listPath: '/spaces',
    paramKey: 'spaceId',
    singular: 'Space',
    select: (s) => s.spaces,
    actions: spacesActions,
  },
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function CatalogDetailsPage({ kind }: { kind: CatalogDetailKind }) {
  const config = CONFIG[kind]
  const params = useParams<{ spaceId?: string }>()
  const entityId = params[config.paramKey]
  const { goToList } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector(config.select)
  const canEdit =
    user?.role === 'super_admin' || user?.role === 'company_admin'
  const [editOpen, setEditOpen] = useState(false)
  const [tab, setTab] = useState<CatalogDetailTabId>('profile')

  useEffect(() => {
    if (!entityId) return
    dispatch(config.actions.fetchDetailRequested({ id: entityId }))
  }, [config.actions, dispatch, entityId])

  usePlatformLoading(
    detailStatus === 'loading' && !detail ? `Loading ${config.singular.toLowerCase()}…` : null,
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!entityId) return <Navigate to={config.listPath} replace />

  const id = entityId
  const item = detail?.id === id ? detail : null

  function refreshDetail() {
    dispatch(config.actions.fetchDetailRequested({ id, force: true }))
  }

  const profile = item ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <EditableSectionCard
          title={config.singular}
          description="Name, status, and description"
          canEdit={canEdit}
          onEdit={() => setEditOpen(true)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <StatusBadge status={item.status} />
          </div>
          <ReadOnlyField
            label="Description"
            value={item.description?.trim() ? item.description : '—'}
          />
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title="Tags"
          description={`Labels linked to this ${config.singular.toLowerCase()}`}
          canEdit={canEdit}
          onEdit={() => setEditOpen(true)}
        >
          {item.tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </EditableSectionCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meta</CardTitle>
            <CardDescription>Record timestamps and references</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReadOnlyField label="Created" value={formatTimestamp(item.createdAt)} />
            <ReadOnlyField label="Updated" value={formatTimestamp(item.updatedAt)} />
            <ReadOnlyField
              label="References"
              value={String(item.referenceCount ?? 0)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <FeaturePage
      title={item?.name ?? config.singular}
      description={`${config.singular} details`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => goToList(kind)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        </div>
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {item ? (
        <CatalogDetailSectionTabs
          ariaLabel={`${config.singular} sections`}
          tab={tab}
          onTabChange={setTab}
          profile={profile}
          attributes={
            <CatalogAttributesTab
              kind={kind}
              entityId={id}
              attributes={item.attributes}
              canEdit={canEdit}
              onChanged={refreshDetail}
            />
          }
          gallery={
            <CatalogLibraryGalleryCard
              kind={kind}
              entityId={id}
              galleryImages={item.galleryImages ?? []}
              accessToken={accessToken}
              canEdit={canEdit}
              onSaved={refreshDetail}
            />
          }
        />
      ) : null}

      {editOpen ? (
        <CatalogFormDialog
          kind={kind}
          open
          id={id}
          onOpenChange={(open) => {
            if (!open) setEditOpen(false)
          }}
          onSaved={() => {
            refreshDetail()
            setEditOpen(false)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

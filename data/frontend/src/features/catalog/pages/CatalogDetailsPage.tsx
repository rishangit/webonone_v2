import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
  ImageCarousel,
  TagChip,
} from '@webonone/ui-kit'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CatalogAttributesTab } from '@/features/catalog/components/CatalogAttributesTab'
import {
  CatalogDetailSectionTabs,
  type CatalogDetailTabId,
} from '@/features/catalog/components/CatalogDetailSectionTabs'
import { CatalogFormDialog } from '@/features/catalog/components/CatalogFormDialog'
import { CatalogLibraryDetailPageMenu } from '@/features/shell/components/CatalogLibraryDetailPageMenu'
import { CatalogLibraryGalleryCard } from '@/features/catalog/components/CatalogLibraryGalleryCard'
import { spacesActions } from '@/features/spaces/store'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import type { CatalogFeatureState } from '@webonone/store-kit'
import type { CatalogItem } from '@/shared/types/data.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

type CatalogDetailKind = 'spaces'

const CATALOG_DETAIL_TABS: readonly CatalogDetailTabId[] = [
  'overview',
  'gallery',
  'attributes',
]

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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function CatalogDetailsPage({ kind }: { kind: CatalogDetailKind }) {
  const { t } = useTranslation('spaces')
  const config = CONFIG[kind]
  const params = useParams<{ spaceId?: string }>()
  const entityId = params[config.paramKey]
  const { goToList } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector(config.select)
  const canEdit =
    user?.role === 'super_admin' || user?.role === 'company_admin'
  const canDelete = user?.role === 'super_admin'
  const [editOpen, setEditOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [tab, setTab] = useDetailTabParam(CATALOG_DETAIL_TABS, 'overview')

  useEffect(() => {
    if (!entityId) return
    dispatch(config.actions.fetchDetailRequested({ id: entityId }))
  }, [config.actions, dispatch, entityId])

  usePlatformLoading(
    detailStatus === 'loading' && !detail ? t('loadingSpace') : null,
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!entityId) return <Navigate to={config.listPath} replace />

  const id = entityId
  const item = detail?.id === id ? detail : null

  function refreshDetail() {
    dispatch(config.actions.fetchDetailRequested({ id, force: true }))
  }

  const overview = item ? (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {(item.galleryImages ?? []).length > 0 ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <ImageCarousel images={item.galleryImages ?? []} alt={item.name} />
            </CardContent>
          </Card>
        ) : null}
        <EditableSectionCard
          title={config.singular}
          description="Name, status, and description"
          status={item.status}
          canEdit={canEdit}
          onEdit={() => setEditOpen(true)}
        >
          <h2 className="text-xl font-semibold">{item.name}</h2>
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
            <ReadOnlyField label="Created" value={formatDisplayDateTime(item.createdAt)} />
            <ReadOnlyField label="Updated" value={formatDisplayDateTime(item.updatedAt)} />
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
      onBack={() => goToList(kind)}
      backLabel={t('common:back')}
      actions={
        item ? (
          <CatalogLibraryDetailPageMenu
            kind="space"
            entityId={item.id}
            entityLabel={item.name}
            ariaLabel={t('actionsFor', { name: item.name })}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => setEditOpen(true)}
            onDelete={() => setPendingDelete(true)}
          />
        ) : undefined
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {item ? (
        <CatalogDetailSectionTabs
          ns="spaces"
          ariaLabel={t('sectionsAria')}
          tab={tab}
          onTabChange={setTab}
          overview={overview}
          attributes={
            <CatalogAttributesTab
              kind={kind}
              entityId={id}
              entityName={item.name}
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

      <PlatformAlertConfirmDialog
        open={pendingDelete}
        title={
          item ? t('deleteConfirm', { name: item.name }) : t('deleteConfirmFallback')
        }
        description={t('deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:remove')}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(false)
        }}
        onConfirm={() => {
          dispatch(config.actions.deleteRequested({ id }))
          goToList(kind)
        }}
      />
    </FeaturePage>
  )
}

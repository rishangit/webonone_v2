import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  FeaturePage,
  ItemListViewToggle,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
} from '@webonone/ui-kit'
import { useListDisplayModeControl } from '@/shared/hooks/useListDisplayModeControl'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { CompanyCatalogItemsList } from '../components/CompanyCatalogItemsList'
import { CatalogFormDialog } from '../components/CatalogFormDialog'
import { ServiceFormDialog } from '../components/ServiceFormDialog'
import { companyCatalogActions } from '../store/companyCatalogStore'
import {
  CATALOG_ENTITY_SINGULAR_KEYS,
  isCatalogGalleryKind,
  type CatalogGalleryKind,
} from '../types/companyCatalog.types'
type CompanyCatalogListPageProps = {
  kind: CatalogGalleryKind
}

export function CompanyCatalogListPage({ kind }: CompanyCatalogListPageProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, listStatus, kind: storeKind } = useAppSelector((s) => s.companyCatalog)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null)

  const entity = t(`entities.${kind}`)
  const noun = t(`entities.${CATALOG_ENTITY_SINGULAR_KEYS[kind]}`)

  const loading =
    listStatus !== 'error' && (storeKind !== kind || (listStatus === 'loading' && items.length === 0))
  usePlatformLoading(loading ? t('list.loading', { entity }) : null)
  const canManage = activeRole === 'company_admin'
  const searchRef = useRef(search)

  useEffect(() => {
    dispatch(
      companyCatalogActions.listRequested({ kind, q: searchRef.current.trim() || undefined }),
    )
  }, [dispatch, kind])

  useEffect(() => {
    if (searchRef.current === search) return
    searchRef.current = search
    const handle = window.setTimeout(() => {
      dispatch(companyCatalogActions.listRequested({ kind, q: search.trim() || undefined }))
    }, 250)
    return () => window.clearTimeout(handle)
  }, [dispatch, kind, search])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.displayName.toLowerCase().includes(q) ||
        (item.displayDescription?.toLowerCase().includes(q) ?? false),
    )
  }, [items, search])

  const excludeLibraryIds = useMemo(
    () =>
      items
        .map((item) => item.libraryEntityId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [items],
  )

  const showThumbnails = isCatalogGalleryKind(kind)
  const { mode: listDisplayMode, setMode: setListDisplayMode } = useListDisplayModeControl()

  const emptyMessage =
    search.trim() ? t('list.emptySearch', { entity }) : t('list.empty', { entity })

  return (
    <FeaturePage
      title={entity}
      description={t('list.description', { entity })}
      actions={
        <ListPageActions>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('list.searchPlaceholder', { entity })}
            onClear={() => setSearch('')}
            aria-label={t('list.searchAria', { entity })}
            className="w-64"
          />
          <ItemListViewToggle value={listDisplayMode} onChange={setListDisplayMode} />
          {canManage ? (
            <ListAddButton onClick={() => setAddOpen(true)}>{t('list.add', { noun })}</ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      <ListPageBody>
        <div className="flex-1">
          {!loading ? (
            <CompanyCatalogItemsList
              items={filtered}
              kind={kind}
              showThumbnails={showThumbnails}
              empty={emptyMessage}
              canManage={canManage}
              onOpen={(id) => navigate(`/data/${kind}/${id}`)}
              onRemove={(item) => setPendingRemove({ id: item.id, name: item.displayName })}
            />
          ) : null}
        </div>
      </ListPageBody>

      {canManage && kind === 'services' ? (
        <ServiceFormDialog
          open={addOpen}
          includeSourceStep
          excludeLibraryIds={excludeLibraryIds}
          onOpenChange={setAddOpen}
          onSaved={() => setAddOpen(false)}
        />
      ) : null}
      {canManage && kind !== 'services' ? (
        <CatalogFormDialog
          open={addOpen}
          kind={kind}
          mode="create"
          includeSourceStep
          excludeLibraryIds={excludeLibraryIds}
          onOpenChange={setAddOpen}
          onSaved={() => setAddOpen(false)}
        />
      ) : null}

      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={
          pendingRemove
            ? t('list.removeTitleNamed', { name: pendingRemove.name })
            : t('list.removeTitle', { noun })
        }
        description={t('list.removeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('remove')}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        onConfirm={() => {
          if (!pendingRemove) return
          dispatch(companyCatalogActions.deleteRequested({ kind, id: pendingRemove.id }))
        }}
      />
    </FeaturePage>
  )
}

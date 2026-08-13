import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Button,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FeaturePage,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListPageBody,
  SearchInput,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { CatalogFormDialog } from '../components/CatalogFormDialog'
import { ServiceFormDialog } from '../components/ServiceFormDialog'
import { companyCatalogActions } from '../store/companyCatalogStore'
import {
  CATALOG_ENTITY_SINGULAR_KEYS,
  isCatalogGalleryKind,
  type CatalogEntityKind,
} from '../types/companyCatalog.types'
import { firstGalleryImageUrl } from '../utils/firstGalleryImageUrl'

type CompanyCatalogListPageProps = {
  kind: CatalogEntityKind
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

  const loading = listStatus === 'loading' && storeKind === kind
  usePlatformLoading(loading ? t('list.loading', { entity }) : null)
  const canManage = activeRole === 'company_admin'

  useEffect(() => {
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

  return (
    <FeaturePage
      title={entity}
      description={t('list.description', { entity })}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('list.searchPlaceholder', { entity })}
            onClear={() => setSearch('')}
            aria-label={t('list.searchAria', { entity })}
            className="w-64"
          />
          {canManage ? (
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('list.add', { noun })}
            </Button>
          ) : null}
        </div>
      }
    >
      <ListPageBody>
        <ItemList>
          {filtered.length === 0 ? (
            <ItemListEmpty>
              {search.trim()
                ? t('list.emptySearch', { entity })
                : t('list.empty', { entity })}
            </ItemListEmpty>
          ) : (
            filtered.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => navigate(`/data/${kind}/${item.id}`)}
                  >
                    {showThumbnails ? (
                      <ImagePreview
                        src={firstGalleryImageUrl(item.displayGalleryImages)}
                        alt=""
                        className="h-12 w-12"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{item.displayName}</span>
                        <StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>
                        {item.libraryUnavailable ? (
                          <StatusTag variant="pending">{t('list.libraryUnavailable')}</StatusTag>
                        ) : null}
                      </div>
                      {item.displayDescription ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.displayDescription}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={`${tc('actions')} ${item.displayName}`}>
                  <DropdownMenuItem onClick={() => navigate(`/data/${kind}/${item.id}`)}>
                    {tc('details')}
                  </DropdownMenuItem>
                  {canManage ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          setPendingRemove({ id: item.id, name: item.displayName })
                        }
                      >
                        {tc('remove')}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </ItemListMenu>
              </ItemListItem>
            ))
          )}
        </ItemList>
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

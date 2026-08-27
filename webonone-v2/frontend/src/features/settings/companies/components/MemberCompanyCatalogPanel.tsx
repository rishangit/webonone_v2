import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListPageBody,
  SearchInput,
  Spinner,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type { HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import {
  isCatalogGalleryKind,
  type CatalogEntityKind,
} from '@/features/company-catalog/types/companyCatalog.types'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'
import { firstGalleryImageUrl } from '@/features/company-catalog/utils/firstGalleryImageUrl'
import {
  companySettingsCatalogItemPath,
  companySettingsListPath,
} from '../utils/companySettingsPaths'

type MemberCompanyCatalogPanelProps = {
  companyId: string
  kind: CatalogEntityKind
  previewMode?: boolean
}

export function MemberCompanyCatalogPanel({
  companyId,
  kind,
  previewMode = false,
}: MemberCompanyCatalogPanelProps) {
  const { t } = useTranslation('catalog')
  const { t: tSettings } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { items: storeItems, listStatus, kind: storeKind } = useAppSelector((s) => s.companyCatalog)
  const [search, setSearch] = useState('')
  const [previewItems, setPreviewItems] = useState<HydratedCatalogItem[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const entity = t(`entities.${kind}`)
  const storeLoading =
    listStatus !== 'error' && (storeKind !== kind || (listStatus === 'loading' && storeItems.length === 0))
  const loading = previewMode ? previewLoading && previewItems.length === 0 : storeLoading

  usePlatformLoading(!previewMode && storeLoading ? t('list.loading', { entity }) : null)

  useEffect(() => {
    if (!previewMode) {
      const handle = window.setTimeout(() => {
        dispatch(
          companyCatalogActions.listRequested({
            kind,
            companyId,
            q: search.trim() || undefined,
          }),
        )
      }, 250)
      return () => window.clearTimeout(handle)
    }

    setPreviewLoading(true)
    setPreviewError(null)
    let cancelled = false
    const handle = window.setTimeout(() => {
      void companyCatalogApi
        .listForDiscover(companyId, kind, { q: search.trim() || undefined })
        .then(async (result) => {
          if (!cancelled) {
            setPreviewItems(await hydrateLinkedCatalogItems(kind, result.items))
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setPreviewError(err instanceof Error ? err.message : t('list.loading', { entity }))
            setPreviewItems([])
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPreviewLoading(false)
          }
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [companyId, dispatch, entity, kind, previewMode, search, t])

  const items = previewMode ? previewItems : storeItems

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.displayName.toLowerCase().includes(q) ||
        (item.displayDescription?.toLowerCase().includes(q) ?? false),
    )
  }, [items, search])

  const showThumbnails = isCatalogGalleryKind(kind)

  function renderRowContent(item: HydratedCatalogItem) {
    return (
      <>
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
            <p className="text-sm text-muted-foreground line-clamp-2">{item.displayDescription}</p>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {previewMode ? (
        <p className="text-sm text-muted-foreground">
          {tSettings('connectedCompanies.findDialogCatalogPreviewHint')}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('list.searchPlaceholder', { entity })}
          onClear={() => setSearch('')}
          aria-label={t('list.searchAria', { entity })}
          className="w-64"
        />
      </div>

      {previewError ? (
        <p className="text-sm text-destructive">{previewError}</p>
      ) : null}

      {previewMode && loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <ListPageBody>
          <ItemList>
            {filtered.length === 0 ? (
              <ItemListEmpty>
                {search.trim() ? t('list.emptySearch', { entity }) : t('list.empty', { entity })}
              </ItemListEmpty>
            ) : (
              filtered.map((item) => (
                <ItemListItem key={item.id}>
                  <ItemListContent>
                    {previewMode ? (
                      <div className="flex w-full items-start gap-3">{renderRowContent(item)}</div>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() =>
                          navigate(
                            companySettingsCatalogItemPath(
                              companySettingsListPath(pathname),
                              companyId,
                              kind,
                              item.id,
                            ),
                          )
                        }
                      >
                        {renderRowContent(item)}
                      </button>
                    )}
                  </ItemListContent>
                </ItemListItem>
              ))
            )}
          </ItemList>
        </ListPageBody>
      )}
    </div>
  )
}

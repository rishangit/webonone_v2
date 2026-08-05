import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListPageBody,
  SearchInput,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import {
  bindingModeLabel,
  CATALOG_ENTITY_LABELS,
  isCatalogGalleryKind,
  type CatalogEntityKind,
} from '@/features/company-catalog/types/companyCatalog.types'
import { firstGalleryImageUrl } from '@/features/company-catalog/utils/firstGalleryImageUrl'

type MemberCompanyCatalogPanelProps = {
  companyId: string
  kind: CatalogEntityKind
}

export function MemberCompanyCatalogPanel({ companyId, kind }: MemberCompanyCatalogPanelProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, listStatus, kind: storeKind } = useAppSelector((s) => s.companyCatalog)
  const [search, setSearch] = useState('')

  const loading = listStatus === 'loading' && storeKind === kind
  usePlatformLoading(loading ? `Loading ${CATALOG_ENTITY_LABELS[kind].toLowerCase()}…` : null)

  useEffect(() => {
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
  }, [dispatch, companyId, kind, search])

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
  const label = CATALOG_ENTITY_LABELS[kind]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}`}
          onClear={() => setSearch('')}
          aria-label={`Search ${label.toLowerCase()}`}
          className="w-64"
        />
      </div>

      <ListPageBody>
        <ItemList>
          {filtered.length === 0 ? (
            <ItemListEmpty>
              {search.trim()
                ? `No ${label.toLowerCase()} match your search.`
                : `No ${label.toLowerCase()} yet.`}
            </ItemListEmpty>
          ) : (
            filtered.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      navigate(`/settings/companies/${companyId}/catalog/${kind}/${item.id}`)
                    }
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
                        <StatusTag variant="verified">{bindingModeLabel(item.bindingMode)}</StatusTag>
                        {item.libraryUnavailable ? (
                          <StatusTag variant="pending">Library unavailable</StatusTag>
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
              </ItemListItem>
            ))
          )}
        </ItemList>
      </ListPageBody>
    </div>
  )
}

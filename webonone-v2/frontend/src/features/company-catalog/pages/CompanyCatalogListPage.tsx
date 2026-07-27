import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Button,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FeaturePage,
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
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { CatalogFormDialog } from '../components/CatalogFormDialog'
import { ServiceFormDialog } from '../components/ServiceFormDialog'
import { companyCatalogActions } from '../store/companyCatalogStore'
import {
  bindingModeLabel,
  CATALOG_ENTITY_LABELS,
  singularLabel,
  type CatalogEntityKind,
} from '../types/companyCatalog.types'

type CompanyCatalogListPageProps = {
  kind: CatalogEntityKind
}

export function CompanyCatalogListPage({ kind }: CompanyCatalogListPageProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { items, listStatus, kind: storeKind } = useAppSelector((s) => s.companyCatalog)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const loading = listStatus === 'loading' && storeKind === kind
  usePlatformLoading(loading ? `Loading ${CATALOG_ENTITY_LABELS[kind].toLowerCase()}…` : null)

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

  const noun = singularLabel(kind).toLowerCase()

  return (
    <FeaturePage
      title={CATALOG_ENTITY_LABELS[kind]}
      description={`Company ${CATALOG_ENTITY_LABELS[kind].toLowerCase()} — link from the Data library, customize linked items on the detail page, or create your own.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${CATALOG_ENTITY_LABELS[kind].toLowerCase()}`}
            onClear={() => setSearch('')}
            aria-label={`Search ${CATALOG_ENTITY_LABELS[kind].toLowerCase()}`}
            className="w-64"
          />
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add {noun}
          </Button>
        </div>
      }
    >
      <ListPageBody>
        <ItemList>
          {filtered.length === 0 ? (
            <ItemListEmpty>
              {search.trim()
                ? `No ${CATALOG_ENTITY_LABELS[kind].toLowerCase()} match your search.`
                : `No company ${CATALOG_ENTITY_LABELS[kind].toLowerCase()} yet.`}
            </ItemListEmpty>
          ) : (
            filtered.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => navigate(`/data/${kind}/${item.id}`)}
                  >
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
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={`Actions for ${item.displayName}`}>
                  <DropdownMenuItem onClick={() => navigate(`/data/${kind}/${item.id}`)}>
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() =>
                      dispatch(companyCatalogActions.deleteRequested({ kind, id: item.id }))
                    }
                  >
                    Remove
                  </DropdownMenuItem>
                </ItemListMenu>
              </ItemListItem>
            ))
          )}
        </ItemList>
      </ListPageBody>

      {kind === 'services' ? (
        <ServiceFormDialog
          open={addOpen}
          includeSourceStep
          excludeLibraryIds={excludeLibraryIds}
          onOpenChange={setAddOpen}
          onSaved={() => setAddOpen(false)}
        />
      ) : (
        <CatalogFormDialog
          open={addOpen}
          kind={kind}
          mode="create"
          includeSourceStep
          excludeLibraryIds={excludeLibraryIds}
          onOpenChange={setAddOpen}
          onSaved={() => setAddOpen(false)}
        />
      )}
    </FeaturePage>
  )
}

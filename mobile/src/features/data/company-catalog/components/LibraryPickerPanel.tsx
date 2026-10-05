import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react-native'
import {
  Body,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListAddButton,
  ListPageActions,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import { LibraryItemCreateHost } from '@/features/data/company-catalog/components/LibraryItemCreateHost'
import {
  dataLibraryApi,
  libraryItemToPayload,
  type LibraryListItem,
} from '@/features/sales/services/dataLibraryApi'
import type { CatalogBindingMode, CatalogEntityKind, CatalogPayload } from '@/features/sales/types/catalog.types'

export type LibraryPickInput = {
  libraryEntityId: string
  mode: Extract<CatalogBindingMode, 'linked' | 'forked'>
  payload?: CatalogPayload
}

export function buildLibraryPick(
  kind: CatalogEntityKind,
  selected: LibraryListItem,
  mode: Extract<CatalogBindingMode, 'linked' | 'forked'>,
): LibraryPickInput {
  if (mode === 'forked') {
    return {
      libraryEntityId: selected.id,
      mode: 'forked',
      payload: libraryItemToPayload(kind, selected),
    }
  }
  return { libraryEntityId: selected.id, mode: 'linked' }
}

function kindShowsThumbnail(kind: CatalogEntityKind): boolean {
  return kind === 'products' || kind === 'services' || kind === 'spaces'
}

function firstGalleryUrl(item: LibraryListItem): string | null {
  const images = item.galleryImages
  if (!Array.isArray(images) || images.length === 0) return null
  const first = images[0]
  return typeof first?.url === 'string' ? first.url : null
}

const SINGULAR_NOUN: Record<CatalogEntityKind, 'product' | 'service' | 'space'> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

function canCreateInLibrary(kind: CatalogEntityKind): kind is 'products' | 'services' | 'spaces' {
  return kind === 'products' || kind === 'services' || kind === 'spaces'
}

export function LibraryPickerPanel({
  active,
  kind,
  excludeLibraryIds,
  selectedId,
  onSelectedChange,
  onCreateOpenChange,
}: {
  active: boolean
  kind: CatalogEntityKind
  excludeLibraryIds: string[]
  selectedId: string | null
  onSelectedChange: (selected: LibraryListItem | null) => void
  onCreateOpenChange?: (open: boolean) => void
}) {
  const { t } = useTranslation('catalog')
  const onCreateOpenChangeRef = useRef(onCreateOpenChange)
  onCreateOpenChangeRef.current = onCreateOpenChange

  const [search, setSearch] = useState('')
  const [items, setItems] = useState<LibraryListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const excluded = useMemo(() => new Set(excludeLibraryIds), [excludeLibraryIds])
  const noun = t(`entities.${SINGULAR_NOUN[kind]}`)
  const nounLower = noun.toLowerCase()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dataLibraryApi.list(kind, {
        q: search.trim() || undefined,
        pageSize: 100,
      })
      setItems(result.items.filter((item) => !excluded.has(item.id)))
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : t('library.loading'))
    } finally {
      setLoading(false)
    }
  }, [kind, search, excluded, t])

  useEffect(() => {
    if (!active) return
    const handle = setTimeout(() => {
      void load()
    }, 200)
    return () => clearTimeout(handle)
  }, [active, load, reloadKey])

  useEffect(() => {
    if (!active) {
      setSearch('')
      onSelectedChange(null)
      setCreateOpen(false)
      onCreateOpenChangeRef.current?.(false)
    }
  }, [active, onSelectedChange])

  function handleCreated(item: LibraryListItem) {
    setCreateOpen(false)
    onCreateOpenChangeRef.current?.(false)
    onSelectedChange(item)
    setItems((prev) => (prev.some((row) => row.id === item.id) ? prev : [item, ...prev]))
  }

  function openCreate() {
    if (!canCreateInLibrary(kind) || createOpen) return
    setCreateOpen(true)
    onCreateOpenChangeRef.current?.(true)
  }

  const showThumbnails = kindShowsThumbnail(kind)

  return (
    <View className="min-h-[240px] gap-3">
      <ListPageActions>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={search ? () => setSearch('') : undefined}
          placeholder={t('list.searchPlaceholder', { entity: noun })}
          accessibilityLabel={t('list.searchAria', { entity: noun })}
          editable={!createOpen}
        />
        {canCreateInLibrary(kind) ? (
          <ListAddButton disabled={createOpen} onPress={openCreate}>
            {t('library.addToLibrary', { noun: nounLower })}
          </ListAddButton>
        ) : null}
      </ListPageActions>
      {error ? <Body className="text-destructive">{error}</Body> : null}
      {loading ? <Spinner label={t('library.loading')} /> : null}
      {!loading ? (
        <ItemList className="py-0">
          {items.length === 0 ? (
            <ItemListEmpty>{t('library.empty', { noun: nounLower })}</ItemListEmpty>
          ) : (
            items.map((item) => {
              const isSelected = selectedId === item.id
              return (
                <ItemListItem
                  key={item.id}
                  selected={isSelected}
                  onPress={() => !createOpen && onSelectedChange(isSelected ? null : item)}
                >
                  {showThumbnails ? (
                    <ImagePreview
                      src={firstGalleryUrl(item)}
                      alt=""
                      className="mr-3 h-10 w-10 rounded-md"
                    />
                  ) : null}
                  <ItemListContent title={item.name} subtitle={item.description ?? undefined} />
                  {isSelected ? (
                    <Check className="ml-auto h-5 w-5 text-primary" aria-hidden />
                  ) : null}
                </ItemListItem>
              )
            })
          )}
        </ItemList>
      ) : null}

      {canCreateInLibrary(kind) ? (
        <LibraryItemCreateHost
          kind={kind}
          open={createOpen}
          onOpenChange={(next) => {
            setCreateOpen(next)
            onCreateOpenChangeRef.current?.(next)
            if (!next) {
              setReloadKey((key) => key + 1)
            }
          }}
          onCreated={handleCreated}
        />
      ) : null}
    </View>
  )
}

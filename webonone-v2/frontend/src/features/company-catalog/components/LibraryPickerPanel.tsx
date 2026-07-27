import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import {
  PLATFORM_MESSAGE_TYPES,
  type PlatformPeerDialogRequestMessage,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  SearchInput,
  cn,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { usePlatformPeerDialog } from '@/features/shell/PlatformPeerDialogContext'
import {
  dataLibraryApi,
  libraryItemToPayload,
  type LibraryListItem,
} from '../services/dataLibraryApi'
import {
  CATALOG_ENTITY_LABELS,
  singularLabel,
  type CatalogBindingMode,
  type CatalogEntityKind,
  type CatalogPayload,
} from '../types/companyCatalog.types'

export type LibraryPickInput = {
  libraryEntityId: string
  mode: Extract<CatalogBindingMode, 'linked' | 'forked'>
  payload?: CatalogPayload
}

type LibraryPickerPanelProps = {
  /** When true, loads/resets the panel. */
  active: boolean
  kind: CatalogEntityKind
  excludeLibraryIds: string[]
  busy?: boolean
  error?: string | null
  onCreateOpenChange?: (open: boolean) => void
  onSelectedChange?: (selected: LibraryListItem | null) => void
}

function createEmbedPath(kind: CatalogEntityKind): string {
  switch (kind) {
    case 'tags':
      return '/embed/dialogs/tags/create'
    case 'units':
      return '/embed/dialogs/units/create'
    case 'attributes':
      return '/embed/dialogs/attributes/create'
    case 'products':
    case 'services':
    case 'spaces':
      return `/embed/dialogs/${kind}/create`
  }
}

function createDialogSize(kind: CatalogEntityKind): {
  sizeWidth: PlatformPeerDialogRequestMessage['sizeWidth']
  sizeHeight: PlatformPeerDialogRequestMessage['sizeHeight']
} {
  if (kind === 'services') {
    return { sizeWidth: 'large', sizeHeight: 'xlarge' }
  }
  return { sizeWidth: 'small', sizeHeight: 'auto' }
}

function isLibraryListItem(value: unknown): value is LibraryListItem {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as LibraryListItem).id === 'string' &&
    typeof (value as LibraryListItem).name === 'string'
  )
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

export function LibraryPickerPanel({
  active,
  kind,
  excludeLibraryIds,
  busy = false,
  error = null,
  onCreateOpenChange,
  onSelectedChange,
}: LibraryPickerPanelProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const dataOrigin = getDataOrigin().replace(/\/$/, '')
  const { openPeerDialog } = usePlatformPeerDialog()

  const onCreateOpenChangeRef = useRef(onCreateOpenChange)
  const onSelectedChangeRef = useRef(onSelectedChange)
  onCreateOpenChangeRef.current = onCreateOpenChange
  onSelectedChangeRef.current = onSelectedChange

  const [q, setQ] = useState('')
  const [items, setItems] = useState<LibraryListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<LibraryListItem | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const reloadList = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!active) return
    setSelected(null)
    onSelectedChangeRef.current?.(null)
    setLoadError(null)
    setCreateOpen(false)
    onCreateOpenChangeRef.current?.(false)
    setQ('')
  }, [active, kind])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    setLoading(true)
    void dataLibraryApi
      .list(kind, { q: q.trim() || undefined, page: 1, pageSize: 50 })
      .then((result) => {
        if (cancelled) return
        const excluded = new Set(excludeLibraryIds)
        setItems(result.items.filter((item) => !excluded.has(item.id)))
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active, kind, q, excludeLibraryIds, reloadKey])

  const label = singularLabel(kind)
  const labelLower = label.toLowerCase()
  const canCreate = Boolean(accessToken && dataOrigin)

  function selectItem(item: LibraryListItem | null) {
    setSelected(item)
    onSelectedChangeRef.current?.(item)
  }

  function handleCreated(payload: unknown) {
    setCreateOpen(false)
    onCreateOpenChangeRef.current?.(false)
    if (isLibraryListItem(payload)) {
      selectItem(payload)
      setItems((prev) => (prev.some((item) => item.id === payload.id) ? prev : [payload, ...prev]))
      return
    }
    reloadList()
  }

  function openCreateInLibrary() {
    if (!canCreate || createOpen) return
    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `catalog-create-${Date.now()}`
    const sizes = createDialogSize(kind)
    setCreateOpen(true)
    onCreateOpenChangeRef.current?.(true)
    openPeerDialog(
      {
        type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST,
        requestId,
        path: createEmbedPath(kind),
        title: `Add ${labelLower} to library`,
        description: `Create a new ${labelLower} in the Data library, then select it for your company.`,
        submitLabel: kind === 'services' ? 'Next' : 'Create',
        ...sizes,
      },
      {
        resolve: (payload) => {
          handleCreated(payload)
        },
        cancel: () => {
          setCreateOpen(false)
          onCreateOpenChangeRef.current?.(false)
        },
      },
      dataOrigin,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <SearchInput
            id="library-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClear={() => setQ('')}
            placeholder={`Search ${CATALOG_ENTITY_LABELS[kind].toLowerCase()}…`}
            aria-label={`Search ${CATALOG_ENTITY_LABELS[kind].toLowerCase()}`}
            disabled={createOpen}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canCreate || busy || createOpen}
          onClick={openCreateInLibrary}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add {labelLower} to library
        </Button>
      </div>
      {(loadError || error) && (
        <Alert variant="destructive">
          <AlertDescription>{error ?? loadError}</AlertDescription>
        </Alert>
      )}
      {!canCreate ? (
        <p className="text-sm text-muted-foreground">
          Sign in and configure `VITE_DATA_ORIGIN` to browse or add library items.
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading library…</p>
      ) : (
        <ItemList>
          {items.length === 0 ? (
            <ItemListEmpty>No library {labelLower} available.</ItemListEmpty>
          ) : (
            items.map((item) => {
              const isSelected = selected?.id === item.id
              return (
                <ItemListItem
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && itemListRowActiveClassName,
                  )}
                  aria-label={`Select ${item.name}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (!createOpen) selectItem(item)
                  }}
                  onKeyDown={(event) => {
                    if (createOpen) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectItem(item)
                    }
                  }}
                >
                  <ItemListContent>
                    <div className="font-medium">{item.name}</div>
                    {item.description ? (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </div>
                    ) : null}
                  </ItemListContent>
                  {isSelected ? (
                    <Check
                      className="ml-auto h-5 w-5 shrink-0 self-center text-primary"
                      aria-hidden
                    />
                  ) : null}
                </ItemListItem>
              )
            })
          )}
        </ItemList>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, ItemList, ItemListContent, ItemListEmpty, ItemListItem, itemListRowActiveClassName, Input, Label } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem, Tag, Unit, Attribute } from '@/shared/types/data.types'

type PickerKind = 'tags' | 'units' | 'attributes' | 'products' | 'services' | 'spaces'

type PickerRow = { id: string; name: string; description: string | null }

function isPickerKind(value: string): value is PickerKind {
  return (
    value === 'tags' ||
    value === 'units' ||
    value === 'attributes' ||
    value === 'products' ||
    value === 'services' ||
    value === 'spaces'
  )
}

async function listLibrary(kind: PickerKind, q?: string): Promise<PickerRow[]> {
  switch (kind) {
    case 'tags': {
      const result = await dataApi.listTags({ q, page: 1, pageSize: 50 })
      return result.items.map((item: Tag) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }))
    }
    case 'units': {
      const result = await dataApi.listUnits({ q, page: 1, pageSize: 50 })
      return result.items.map((item: Unit) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }))
    }
    case 'attributes': {
      const result = await dataApi.listAttributes({ q, page: 1, pageSize: 50 })
      return result.items.map((item: Attribute) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }))
    }
    case 'products':
    case 'services':
    case 'spaces': {
      const list =
        kind === 'products'
          ? dataApi.listProducts
          : kind === 'services'
            ? dataApi.listServices
            : dataApi.listSpaces
      const result = await list({ q, page: 1, pageSize: 50 })
      return result.items.map((item: CatalogItem) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }))
    }
  }
}

/**
 * Peer-dialog body for selecting a library catalog item (host owns header/footer).
 * Path: /embed/dialogs/catalog/:kind/select
 */
export function CatalogLibrarySelectEmbedPage() {
  const { kind: kindParam = '' } = useParams()
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const kind = isPickerKind(kindParam) ? kindParam : null

  const [q, setQ] = useState('')
  const [items, setItems] = useState<PickerRow[]>([])
  const [selected, setSelected] = useState<PickerRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!kind) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void listLibrary(kind, q.trim() || undefined)
      .then((rows) => {
        if (!cancelled) setItems(rows)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kind, q])

  const onSubmit = useCallback(() => {
    if (!parentOrigin || !requestId || !selected || !kind) {
      if (parentOrigin && requestId) {
        sendPlatformPeerDialogBusy(parentOrigin, requestId, false)
      }
      return
    }
    sendPlatformPeerDialogBusy(parentOrigin, requestId, true)
    sendPlatformPeerDialogComplete(parentOrigin, requestId, {
      kind,
      id: selected.id,
      name: selected.name,
      description: selected.description,
    })
  }, [kind, parentOrigin, requestId, selected])

  usePlatformPeerDialogSubmit({
    parentOrigin,
    requestId,
    onSubmit,
  })

  if (!kind) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Unknown catalog kind.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-col gap-2">
        <Label htmlFor="catalog-library-search">Search</Label>
        <Input
          id="catalog-library-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search library…"
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ItemList>
          {items.length === 0 ? (
            <ItemListEmpty>No library items found.</ItemListEmpty>
          ) : (
            items.map((item) => (
              <ItemListItem
                key={item.id}
                className={selected?.id === item.id ? itemListRowActiveClassName : undefined}
                onClick={() => setSelected(item)}
              >
                <ItemListContent>
                  <div className="font-medium">{item.name}</div>
                  {item.description ? (
                    <div className="text-sm text-muted-foreground line-clamp-2">{item.description}</div>
                  ) : null}
                </ItemListContent>
              </ItemListItem>
            ))
          )}
        </ItemList>
      )}
    </div>
  )
}

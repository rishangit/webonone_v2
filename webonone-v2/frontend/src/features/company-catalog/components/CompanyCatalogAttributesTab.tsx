import { useEffect, useState } from 'react'
import { Edit3 } from 'lucide-react'
import {
  Button,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/ui-kit'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
  type LibraryCatalogAttribute,
} from '../services/dataLibraryApi'
import type { CatalogGalleryKind, CatalogPayload } from '../types/companyCatalog.types'
import { singularLabel } from '../types/companyCatalog.types'

type CompanyCatalogAttributesTabProps = {
  kind: CatalogGalleryKind
  libraryEntityId: string | null
  /** Company payload / hydrated payload when there is no library id (custom). */
  payload: CatalogPayload | null
  canEdit: boolean
  onEdit: () => void
}

function isSimpleAttrRow(
  row: unknown,
): row is { attributeId: string; valueText?: string | null; valueNumber?: number | null } {
  return (
    Boolean(row) &&
    typeof row === 'object' &&
    typeof (row as { attributeId?: unknown }).attributeId === 'string'
  )
}

function looksLikeRichAttributes(raw: unknown[]): boolean {
  return raw.some(
    (entry) =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      (Array.isArray((entry as { values?: unknown }).values) ||
        typeof (entry as { name?: unknown }).name === 'string' ||
        (entry as { unit?: unknown }).unit != null ||
        typeof (entry as { valueType?: unknown }).valueType === 'string'),
  )
}

export function CompanyCatalogAttributesTab({
  kind,
  libraryEntityId,
  payload,
  canEdit,
  onEdit,
}: CompanyCatalogAttributesTabProps) {
  const [attributes, setAttributes] = useState<LibraryCatalogAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)

      try {
        if (libraryEntityId) {
          const item = await dataLibraryApi.get(kind, libraryEntityId)
          if (cancelled) return
          setAttributes(parseLibraryAttributes(item.attributes))
          return
        }

        const rawAttrs = Array.isArray(payload?.attributes) ? payload.attributes : []

        // Prefer rich shape already on payload (e.g. after hydration / fork)
        if (looksLikeRichAttributes(rawAttrs)) {
          if (cancelled) return
          setAttributes(parseLibraryAttributes(rawAttrs))
          return
        }

        const simpleRows = rawAttrs.filter(isSimpleAttrRow)
        const attrIds = simpleRows.map((row) => row.attributeId)
        if (attrIds.length === 0) {
          if (cancelled) return
          setAttributes([])
          return
        }

        let byId = new Map<string, { id: string; name: string; valueType?: unknown }>()
        try {
          const result = await dataLibraryApi.list('attributes', {
            ids: attrIds,
            pageSize: Math.min(100, attrIds.length),
          })
          byId = new Map(result.items.map((item) => [item.id, item]))
        } catch {
          byId = new Map()
        }

        if (cancelled) return
        setAttributes(
          simpleRows.map((row) => {
            const lib = byId.get(row.attributeId)
            const valueType = lib?.valueType === 'number' ? 'number' : 'text'
            return {
              attributeId: row.attributeId,
              name: lib?.name ?? row.attributeId,
              valueType,
              unit: null,
              values: [
                {
                  id: `${row.attributeId}-payload`,
                  valueText: row.valueText ?? null,
                  valueNumber: row.valueNumber ?? null,
                  isDefault: true,
                },
              ],
            }
          }),
        )
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load attributes')
        setAttributes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [kind, libraryEntityId, payload])

  const entityLabel = singularLabel(kind).toLowerCase()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-foreground">Attributes</h2>
          <p className="text-sm text-muted-foreground">
            {libraryEntityId
              ? `Library attributes linked to this ${entityLabel}.`
              : `Custom attribute values for this ${entityLabel}.`}
          </p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={onEdit} disabled={loading}>
            <Edit3 className="h-4 w-4" aria-hidden />
            Edit
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && attributes.length === 0 ? (
        <ItemListEmpty>Loading attributes…</ItemListEmpty>
      ) : attributes.length === 0 ? (
        <ItemListEmpty>No attributes linked yet.</ItemListEmpty>
      ) : (
        <ItemList>
          {attributes.map((attr) => (
            <ItemListItem key={attr.attributeId}>
              <ItemListContent>
                <p className="truncate font-medium">{attr.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  <span className="capitalize">{attr.valueType}</span>
                  {attr.unit ? ` · ${attr.unit.name} (${attr.unit.symbol})` : ''}
                  {` · ${attr.values.length} value${attr.values.length === 1 ? '' : 's'}`}
                </p>
                {attr.values.length > 0 ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {attr.values
                      .map((value) =>
                        formatLibraryAttributeValueLabel(value, attr.unit?.symbol),
                      )
                      .join(' · ')}
                  </p>
                ) : null}
              </ItemListContent>
            </ItemListItem>
          ))}
        </ItemList>
      )}
    </div>
  )
}

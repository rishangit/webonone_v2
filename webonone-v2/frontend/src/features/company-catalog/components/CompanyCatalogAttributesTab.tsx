import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Edit3 } from 'lucide-react'
import {
  Button,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { CompanyCatalogAttributeAiMenuItem } from './CompanyCatalogAttributeAiMenuItem'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
  type LibraryCatalogAttribute,
} from '../services/dataLibraryApi'
import {
  CATALOG_ENTITY_SINGULAR_KEYS,
  type CatalogGalleryKind,
  type CatalogPayload,
} from '../types/companyCatalog.types'

type CompanyCatalogAttributesTabProps = {
  kind: CatalogGalleryKind
  /** Company catalog entity id (for attribute detail navigation). */
  entityId: string
  entityName: string
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
  entityId,
  entityName,
  libraryEntityId,
  payload,
  canEdit,
  onEdit,
}: CompanyCatalogAttributesTabProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
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
        setError(err instanceof Error ? err.message : t('attributesTab.failedLoad'))
        setAttributes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [kind, libraryEntityId, payload, t])

  const noun = t(`entities.${CATALOG_ENTITY_SINGULAR_KEYS[kind]}`)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('detail.tabs.attributes')}</h2>
          <p className="text-sm text-muted-foreground">
            {libraryEntityId
              ? t('attributesTab.libraryLinked', { noun })
              : t('attributesTab.customValues', { noun })}
          </p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={onEdit} disabled={loading}>
            <Edit3 className="h-4 w-4" aria-hidden />
            {tc('edit')}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && attributes.length === 0 ? (
        <ItemListEmpty>{t('attributesTab.loading')}</ItemListEmpty>
      ) : attributes.length === 0 ? (
        <ItemListEmpty>{t('attributesTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {attributes.map((attr) => {
            const rowBody = (
              <>
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
              </>
            )
            const canOpenDetail = Boolean(libraryEntityId)
            return (
              <ItemListItem key={attr.attributeId}>
                <ItemListContent>
                  {canOpenDetail ? (
                    <button
                      type="button"
                      className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() =>
                        navigate(
                          `/data/${kind}/${entityId}/attributes/${attr.attributeId}`,
                        )
                      }
                    >
                      {rowBody}
                    </button>
                  ) : (
                    rowBody
                  )}
                </ItemListContent>
                {libraryEntityId ? (
                  <ItemListMenu ariaLabel={t('attributesTab.actionsFor', { name: attr.name })}>
                    <CompanyCatalogAttributeAiMenuItem
                      kind={kind}
                      libraryEntityId={libraryEntityId}
                      entityName={entityName}
                      attributeId={attr.attributeId}
                      attributeName={attr.name}
                      mode="copy"
                    />
                    <CompanyCatalogAttributeAiMenuItem
                      kind={kind}
                      libraryEntityId={libraryEntityId}
                      entityName={entityName}
                      attributeId={attr.attributeId}
                      attributeName={attr.name}
                      mode="suggest_values"
                    />
                  </ItemListMenu>
                ) : null}
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </div>
  )
}

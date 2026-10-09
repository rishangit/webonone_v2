import { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  Muted,
  Subheading,
} from '@webonone/mobile-ui'
import { subscribeAiCatalogMutation } from '@/features/ai/utils/aiCatalogEvents'
import { isDataAttributeValueWriteTool } from '@/features/ai/utils/catalogAiMutationRefresh'
import { CompanyCatalogAttributeAiMenuItem } from '@/features/data/company-catalog/components/CompanyCatalogAttributeAiMenuItem'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
  type LibraryCatalogAttribute,
} from '@/features/sales/services/dataLibraryApi'
import type { CatalogEntityKind, CatalogPayload } from '@/features/sales/types/catalog.types'
import {
  companyCatalogAttributeDetailPath,
  type CatalogKind,
} from '@/features/data/utils/dataPaths'

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
}: {
  kind: CatalogKind
  entityId: string
  entityName: string
  libraryEntityId: string | null
  payload: CatalogPayload | null
  canEdit: boolean
  onEdit: () => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const [attributes, setAttributes] = useState<LibraryCatalogAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const noun = t(`entities.${kind === 'products' ? 'product' : kind === 'services' ? 'service' : 'space'}`)

  const loadAttributes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (libraryEntityId) {
        const item = await dataLibraryApi.get(kind as CatalogEntityKind, libraryEntityId)
        setAttributes(parseLibraryAttributes(item.attributes))
        return
      }

      const rawAttrs = Array.isArray(payload?.attributes) ? payload.attributes : []
      if (looksLikeRichAttributes(rawAttrs)) {
        setAttributes(parseLibraryAttributes(rawAttrs))
        return
      }

      const simpleRows = rawAttrs.filter(isSimpleAttrRow)
      const attrIds = simpleRows.map((row) => row.attributeId)
      if (attrIds.length === 0) {
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
      setError(err instanceof Error ? err.message : t('attributesTab.failedLoad'))
      setAttributes([])
    } finally {
      setLoading(false)
    }
  }, [kind, libraryEntityId, payload, t])

  useEffect(() => {
    void loadAttributes()
  }, [loadAttributes])

  useEffect(() => {
    return subscribeAiCatalogMutation((toolName) => {
      if (isDataAttributeValueWriteTool(toolName)) {
        void loadAttributes()
      }
    })
  }, [loadAttributes])

  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1 gap-1">
          <Subheading>{t('detail.tabs.attributes')}</Subheading>
          <Muted className="text-sm">
            {libraryEntityId
              ? t('attributesTab.libraryLinked', { noun })
              : t('attributesTab.customValues', { noun })}
          </Muted>
        </View>
        {canEdit ? (
          <Button size="sm" variant="outline" onPress={onEdit} disabled={loading}>
            {tc('edit')}
          </Button>
        ) : null}
      </View>
      {error ? <Body className="text-destructive">{error}</Body> : null}
      {loading && attributes.length === 0 ? (
        <ItemListEmpty>{t('attributesTab.loading')}</ItemListEmpty>
      ) : attributes.length === 0 ? (
        <ItemListEmpty>{t('attributesTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList className="py-0" nestedInCard>
          {attributes.map((attr) => {
            const canOpenDetail = Boolean(libraryEntityId)
            const subtitle = [
              `${attr.valueType}${attr.unit ? ` · ${attr.unit.name} (${attr.unit.symbol})` : ''} · ${attr.values.length} value${attr.values.length === 1 ? '' : 's'}`,
              attr.values.length > 0
                ? attr.values
                    .map((value) => formatLibraryAttributeValueLabel(value, attr.unit?.symbol))
                    .join(' · ')
                : '',
            ]
              .filter(Boolean)
              .join('\n')

            return (
              <ItemListItem key={attr.attributeId}>
                {canOpenDetail ? (
                  <Pressable
                    className="min-w-0 flex-1"
                    onPress={() =>
                      router.push(
                        companyCatalogAttributeDetailPath(kind, entityId, attr.attributeId) as Href,
                      )
                    }
                  >
                    <ItemListContent title={attr.name} subtitle={subtitle} />
                  </Pressable>
                ) : (
                  <ItemListContent title={attr.name} subtitle={subtitle} />
                )}
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
    </View>
  )
}

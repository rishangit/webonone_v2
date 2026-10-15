import { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListAddButton,
  Muted,
  Subheading,
} from '@webonone/mobile-ui'
import { subscribeAiCatalogMutation } from '@/features/ai/utils/aiCatalogEvents'
import { isDataAttributeValueWriteTool } from '@/features/ai/utils/catalogAiMutationRefresh'
import { CompanyCatalogAttributeAiMenuItem } from '@/features/data/company-catalog/components/CompanyCatalogAttributeAiMenuItem'
import { CompanyCatalogAttributePickerDialog } from '@/features/data/company-catalog/components/CompanyCatalogAttributePickerDialog'
import {
  companyCatalogApi,
  type CompanyCatalogAttribute,
} from '@/features/data/services/companyCatalogApi'
import { formatLibraryAttributeValueLabel } from '@/features/sales/services/dataLibraryApi'
import {
  companyCatalogAttributeDetailPath,
  type CatalogKind,
} from '@/features/data/utils/dataPaths'

export function CompanyCatalogAttributesTab({
  kind,
  entityId,
  entityName,
  libraryEntityId,
  canAdd,
}: {
  kind: CatalogKind
  entityId: string
  entityName: string
  libraryEntityId: string | null
  canAdd: boolean
}) {
  const { t } = useTranslation('catalog')
  const router = useRouter()
  const [attributes, setAttributes] = useState<CompanyCatalogAttribute[]>([])
  const [linkedLibraryId, setLinkedLibraryId] = useState<string | null>(libraryEntityId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const noun = t(`entities.${kind === 'products' ? 'product' : kind === 'services' ? 'service' : 'space'}`)

  const loadAttributes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.listCopiedAttributes(kind, entityId)
      setAttributes(result.attributes)
      setLinkedLibraryId(result.libraryEntityId ?? libraryEntityId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attributesTab.failedLoad'))
      setAttributes([])
    } finally {
      setLoading(false)
    }
  }, [entityId, kind, libraryEntityId, t])

  useEffect(() => {
    void loadAttributes()
  }, [loadAttributes])

  useEffect(() => {
    return subscribeAiCatalogMutation((toolName) => {
      if (isDataAttributeValueWriteTool(toolName)) void loadAttributes()
    })
  }, [loadAttributes])

  return (
    <View className="gap-4">
      <View className="gap-3">
        <View className="gap-1">
          <Subheading>{t('detail.tabs.attributes')}</Subheading>
          <Muted className="text-sm">{t('attributesTab.copiedHint', { noun })}</Muted>
        </View>
        {canAdd ? (
          <View className="items-end">
            <ListAddButton onPress={() => setPickerOpen(true)} disabled={loading}>
              {t('attributesTab.add')}
            </ListAddButton>
          </View>
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
            const subtitle = [
              `${attr.valueType}${attr.unit ? ` · ${attr.unit.name} (${attr.unit.symbol})` : ''} · ${t('attributesTab.valueCount', { count: attr.values.length })}`,
              attr.values
                .map((value) => formatLibraryAttributeValueLabel(value, attr.unit?.symbol))
                .join(' · '),
            ]
              .filter(Boolean)
              .join('\n')
            return (
              <ItemListItem key={attr.attributeId}>
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
                {linkedLibraryId ? (
                  <ItemListMenu ariaLabel={t('attributesTab.actionsFor', { name: attr.name })}>
                    <CompanyCatalogAttributeAiMenuItem
                      kind={kind}
                      libraryEntityId={linkedLibraryId}
                      entityName={entityName}
                      attributeId={attr.attributeId}
                      attributeName={attr.name}
                      mode="copy"
                    />
                    {canAdd ? (
                      <CompanyCatalogAttributeAiMenuItem
                        kind={kind}
                        libraryEntityId={linkedLibraryId}
                        entityName={entityName}
                        attributeId={attr.attributeId}
                        attributeName={attr.name}
                        mode="suggest_values"
                      />
                    ) : null}
                  </ItemListMenu>
                ) : null}
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
      <CompanyCatalogAttributePickerDialog
        open={pickerOpen}
        kind={kind}
        entityId={entityId}
        libraryEntityId={linkedLibraryId}
        copiedAttributes={attributes}
        onOpenChange={setPickerOpen}
        onCopied={() => {
          void loadAttributes()
        }}
      />
    </View>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react-native'
import {
  Body,
  Button,
  Card,
  ConfirmDialog,
  EditableSectionCard,
  FeatureScreen,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  useToast,
} from '@webonone/mobile-ui'
import { subscribeAiCatalogMutation } from '@/features/ai/utils/aiCatalogEvents'
import { isDataAttributeValueWriteTool } from '@/features/ai/utils/catalogAiMutationRefresh'
import { CompanyCatalogAttributeValueFormDialog } from '@/features/data/company-catalog/components/CompanyCatalogAttributeValueFormDialog'
import { useDataCatalogScope } from '@/features/data/hooks/useDataCatalogScope'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import { catalogDetailPath, type CatalogKind } from '@/features/data/utils/dataPaths'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
  type LibraryAttributeValueEntry,
  type LibraryCatalogAttribute,
} from '@/features/sales/services/dataLibraryApi'

export function CompanyCatalogAttributeDetailScreen({
  kind,
  entityId,
  attributeId,
}: {
  kind: CatalogKind
  entityId: string
  attributeId: string
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { canManageCompanyCatalog } = useDataCatalogScope()

  const [attribute, setAttribute] = useState<LibraryCatalogAttribute | null>(null)
  const [libraryEntityId, setLibraryEntityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [valueDialog, setValueDialog] = useState<{
    open: boolean
    value?: LibraryAttributeValueEntry | null
  }>({ open: false })
  const [pendingDeleteValue, setPendingDeleteValue] = useState<LibraryAttributeValueEntry | null>(
    null,
  )

  const galleryKind = kind as 'products' | 'services' | 'spaces'
  const canEdit = canManageCompanyCatalog && Boolean(libraryEntityId)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const companyEntity = await companyCatalogApi.get(kind, entityId)
      if (!companyEntity.libraryEntityId) {
        setAttribute(null)
        setLibraryEntityId(null)
        setError(t('attributeDetail.notLinked'))
        return
      }
      setLibraryEntityId(companyEntity.libraryEntityId)
      const libraryItem = await dataLibraryApi.get(kind, companyEntity.libraryEntityId)
      const found =
        parseLibraryAttributes(libraryItem.attributes).find(
          (entry) => entry.attributeId === attributeId,
        ) ?? null
      setAttribute(found)
      if (!found) {
        setError(t('attributeDetail.notFound'))
      }
    } catch (err) {
      setAttribute(null)
      setLibraryEntityId(null)
      setError(err instanceof Error ? err.message : t('attributeDetail.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [attributeId, entityId, kind, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return subscribeAiCatalogMutation((toolName) => {
      if (isDataAttributeValueWriteTool(toolName)) {
        void load()
      }
    })
  }, [load])

  async function handleSetDefault(entry: LibraryAttributeValueEntry) {
    if (!libraryEntityId || entry.isDefault || busy) return
    setBusy(true)
    setError(null)
    try {
      await dataLibraryApi.setCatalogAttributeValueDefault(galleryKind, libraryEntityId, entry.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attributeDetail.setDefaultFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteValue(entry: LibraryAttributeValueEntry) {
    if (!libraryEntityId || busy) return
    setBusy(true)
    setError(null)
    try {
      await dataLibraryApi.deleteCatalogAttributeValue(galleryKind, libraryEntityId, entry.id)
      setPendingDeleteValue(null)
      toast({ title: tc('delete') })
      await load()
    } catch (err) {
      toast({
        title: tc('delete'),
        description: err instanceof Error ? err.message : t('attributeDetail.deleteValueFailed'),
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const unitLabel = attribute?.unit
    ? `${attribute.unit.name}${attribute.unit.symbol ? ` (${attribute.unit.symbol})` : ''}`
    : t('attributeDetail.noUnit')

  return (
    <>
      <FeatureScreen
        title={attribute?.name ?? t('attributeDetail.titleFallback')}
        description={t('attributeDetail.description')}
        onBack={() => router.push(`${catalogDetailPath(kind, entityId)}?tab=attributes` as never)}
        backLabel={tc('back')}
      >
        {loading && !attribute ? <Spinner label={t('attributeDetail.loading')} /> : null}
        {error ? <Body className="text-destructive">{error}</Body> : null}

        {attribute && libraryEntityId ? (
          <View className="gap-6">
            <EditableSectionCard
              title={t('attributeDetail.values.title')}
              description={t('attributeDetail.values.description')}
              titleExtra={
                canEdit ? (
                  <Button
                    size="sm"
                    onPress={() => setValueDialog({ open: true, value: null })}
                    disabled={busy}
                  >
                    <Plus className="mr-1 h-4 w-4 text-primary-foreground" aria-hidden />
                    {t('attributeDetail.addValue')}
                  </Button>
                ) : null
              }
            >
              {attribute.values.length === 0 ? (
                <ItemListEmpty>{t('attributeDetail.values.empty')}</ItemListEmpty>
              ) : (
                <ItemList className="py-0">
                  {attribute.values.map((value) => {
                    const label = formatLibraryAttributeValueLabel(value, attribute.unit?.symbol)
                    return (
                      <ItemListItem key={value.id}>
                        <ItemListContent
                          title={label}
                          subtitle={
                            value.isDefault ? t('attributeDetail.values.default') : undefined
                          }
                        />
                        {canEdit ? (
                          <ItemListMenu
                            ariaLabel={t('attributeDetail.actionsForValue', { label })}
                          >
                            {!value.isDefault ? (
                              <ItemListMenuItem
                                disabled={busy}
                                onPress={() => void handleSetDefault(value)}
                              >
                                {t('attributeDetail.setAsDefault')}
                              </ItemListMenuItem>
                            ) : null}
                            <ItemListMenuItem
                              disabled={busy}
                              onPress={() => setValueDialog({ open: true, value })}
                            >
                              {tc('edit')}
                            </ItemListMenuItem>
                            <ItemListMenuItem
                              destructive
                              disabled={busy}
                              onPress={() => setPendingDeleteValue(value)}
                            >
                              {tc('delete')}
                            </ItemListMenuItem>
                          </ItemListMenu>
                        ) : null}
                      </ItemListItem>
                    )
                  })}
                </ItemList>
              )}
            </EditableSectionCard>

            <Card className="gap-4 p-4">
              <View className="gap-1">
                <Body className="text-lg font-medium">{t('attributeDetail.definition.title')}</Body>
                <Muted className="text-sm">{t('attributeDetail.definition.description')}</Muted>
              </View>
              <ReadOnlyField
                label={t('attributeDetail.definition.name')}
                value={attribute.name}
              />
              <ReadOnlyField
                label={t('attributeDetail.definition.valueType')}
                value={attribute.valueType}
              />
              <ReadOnlyField label={t('attributeDetail.definition.unit')} value={unitLabel} />
            </Card>
          </View>
        ) : null}
      </FeatureScreen>

      {libraryEntityId && attribute ? (
        <CompanyCatalogAttributeValueFormDialog
          open={valueDialog.open}
          kind={galleryKind}
          libraryEntityId={libraryEntityId}
          attribute={attribute}
          value={valueDialog.value}
          onOpenChange={(open) => setValueDialog((current) => ({ ...current, open }))}
          onSaved={() => void load()}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDeleteValue !== null}
        onOpenChange={(open) => !open && setPendingDeleteValue(null)}
        title={
          pendingDeleteValue && attribute
            ? t('attributeDetail.deleteValueConfirm', {
                value: formatLibraryAttributeValueLabel(
                  pendingDeleteValue,
                  attribute.unit?.symbol,
                ),
              })
            : t('attributeDetail.deleteValueFallback')
        }
        description={t('attributeDetail.deleteValueDescription', {
          name: attribute?.name ?? '',
        })}
        confirmLabel={tc('delete')}
        destructive
        busy={busy}
        onConfirm={() => {
          if (pendingDeleteValue) void handleDeleteValue(pendingDeleteValue)
        }}
      />
    </>
  )
}

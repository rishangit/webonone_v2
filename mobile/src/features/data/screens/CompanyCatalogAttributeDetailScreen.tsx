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
import { CompanyCatalogAttributeValuePickerDialog } from '@/features/data/company-catalog/components/CompanyCatalogAttributeValuePickerDialog'
import { useDataCatalogScope } from '@/features/data/hooks/useDataCatalogScope'
import {
  companyCatalogApi,
  type CompanyCatalogAttribute,
} from '@/features/data/services/companyCatalogApi'
import { catalogDetailPath, type CatalogKind } from '@/features/data/utils/dataPaths'
import { formatLibraryAttributeValueLabel } from '@/features/sales/services/dataLibraryApi'

function isAttributeValueDeleteBlocked(
  value: CompanyCatalogAttribute['values'][number],
): boolean {
  return (value.usedByVariants?.length ?? 0) > 0
}

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

  const [attribute, setAttribute] = useState<CompanyCatalogAttribute | null>(null)
  const [libraryEntityId, setLibraryEntityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [valueDialog, setValueDialog] = useState<{
    open: boolean
    value?: CompanyCatalogAttribute['values'][number] | null
  }>({ open: false })
  const [pendingDeleteValue, setPendingDeleteValue] = useState<
    CompanyCatalogAttribute['values'][number] | null
  >(null)

  const galleryKind = kind as 'products' | 'services' | 'spaces'
  const canEdit = canManageCompanyCatalog

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.listCopiedAttributes(kind, entityId)
      setLibraryEntityId(result.libraryEntityId)
      const found = result.attributes.find((entry) => entry.attributeId === attributeId) ?? null
      setAttribute(found)
      if (!found) setError(t('attributeDetail.notFound'))
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

  async function handleSetDefault(entry: CompanyCatalogAttribute['values'][number]) {
    if (entry.isDefault || busy) return
    setBusy(true)
    setError(null)
    try {
      await companyCatalogApi.setCopiedAttributeValueDefault(galleryKind, entityId, entry.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attributeDetail.setDefaultFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteValue(entry: CompanyCatalogAttribute['values'][number]) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await companyCatalogApi.deleteCopiedAttributeValue(galleryKind, entityId, entry.id)
      setPendingDeleteValue(null)
      toast({ title: tc('delete') })
      await load()
    } catch (err) {
      setPendingDeleteValue(null)
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

        {attribute ? (
          <View className="gap-6">
            <EditableSectionCard
              title={t('attributeDetail.values.title')}
              titleExtra={
                canEdit ? (
                  <Button
                    size="sm"
                    onPress={() => setPickerOpen(true)}
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
                <ItemList className="py-0" nestedInCard>
                  {attribute.values.map((value) => {
                    const label = formatLibraryAttributeValueLabel(value, attribute.unit?.symbol)
                    const deleteBlocked = isAttributeValueDeleteBlocked(value)
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
                              disabled={busy || deleteBlocked}
                              onPress={() => {
                                if (deleteBlocked) return
                                setPendingDeleteValue(value)
                              }}
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

      {attribute ? (
        <>
          <CompanyCatalogAttributeValuePickerDialog
            open={pickerOpen}
            kind={galleryKind}
            entityId={entityId}
            attributeId={attribute.attributeId}
            libraryEntityId={libraryEntityId}
            copiedLibraryValueIds={attribute.values
              .map((value) => value.libraryValueId)
              .filter((id): id is string => Boolean(id))}
            unitSymbol={attribute.unit?.symbol ?? null}
            onOpenChange={setPickerOpen}
            onCopied={() => void load()}
            onCreate={() => {
              setPickerOpen(false)
              setValueDialog({ open: true, value: null })
            }}
          />
          <CompanyCatalogAttributeValueFormDialog
            open={valueDialog.open}
            kind={galleryKind}
            entityId={entityId}
            attribute={attribute}
            value={valueDialog.value}
            onOpenChange={(open) => setValueDialog((current) => ({ ...current, open }))}
            onSaved={() => void load()}
          />
        </>
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
        description={t('attributeDetail.deleteValueDescription')}
        confirmLabel={tc('delete')}
        destructive
        busy={busy}
        confirmDisabled={
          pendingDeleteValue != null && isAttributeValueDeleteBlocked(pendingDeleteValue)
        }
        onConfirm={() => {
          if (pendingDeleteValue && !isAttributeValueDeleteBlocked(pendingDeleteValue)) {
            void handleDeleteValue(pendingDeleteValue)
          }
        }}
      />
    </>
  )
}

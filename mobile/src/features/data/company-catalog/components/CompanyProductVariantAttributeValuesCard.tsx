import { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  CustomDialog,
  EditableSectionCard,
  NativeSelect,
  ReadOnlyField,
  useToast,
} from '@webonone/mobile-ui'
import {
  companyCatalogApi,
  type CompanyCatalogAttribute,
  type CompanyCatalogVariant,
} from '@/features/data/services/companyCatalogApi'
import { formatLibraryAttributeValueLabel } from '@/features/sales/services/dataLibraryApi'

function multiValueAttributes(attributes: CompanyCatalogAttribute[]) {
  return attributes.filter((attribute) => attribute.values.length >= 2)
}

function initialSelected(variant: CompanyCatalogVariant): Record<string, string> {
  const selected: Record<string, string> = {}
  for (const pick of variant.values) {
    if (pick.libraryValueId) selected[pick.attributeId] = pick.libraryValueId
  }
  return selected
}

function resolveLibraryValueIds(
  attributes: CompanyCatalogAttribute[],
  selectedByAttributeId: Record<string, string>,
): string[] {
  const ids: string[] = []
  for (const attribute of attributes) {
    if (attribute.values.length === 0) continue
    if (attribute.values.length === 1) {
      const libraryId = attribute.values[0]?.libraryValueId
      if (libraryId) ids.push(libraryId)
      continue
    }
    const libraryId = selectedByAttributeId[attribute.attributeId]
    if (libraryId) ids.push(libraryId)
  }
  return ids
}

function combinationKey(libraryValueIds: string[]): string {
  return [...libraryValueIds].sort().join('|')
}

function isDuplicate(
  attributes: CompanyCatalogAttribute[],
  selectedByAttributeId: Record<string, string>,
  existingVariants: CompanyCatalogVariant[],
  excludeVariantId: string,
): boolean {
  const nextKey = combinationKey(resolveLibraryValueIds(attributes, selectedByAttributeId))
  return existingVariants.some((variant) => {
    if (variant.id === excludeVariantId) return false
    return combinationKey(variant.values.map((value) => value.libraryValueId)) === nextKey
  })
}

export function CompanyProductVariantAttributeValuesCard({
  productId,
  variant,
  canEdit,
  onVariantUpdated,
}: {
  productId: string
  variant: CompanyCatalogVariant
  canEdit: boolean
  onVariantUpdated: (variant: CompanyCatalogVariant) => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [attributes, setAttributes] = useState<CompanyCatalogAttribute[]>([])
  const [existingVariants, setExistingVariants] = useState<CompanyCatalogVariant[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedByAttributeId, setSelectedByAttributeId] = useState<Record<string, string>>({})
  const [combinationError, setCombinationError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const multi = useMemo(() => multiValueAttributes(attributes), [attributes])

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const [attributeResult, variantResult] = await Promise.all([
        companyCatalogApi.listCopiedAttributes('products', productId),
        companyCatalogApi.listCopiedVariants(productId),
      ])
      setAttributes(attributeResult.attributes)
      setExistingVariants(variantResult.items)
    } catch {
      setAttributes([])
      setExistingVariants([])
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (!editOpen) return
    setSelectedByAttributeId(initialSelected(variant))
    setCombinationError(null)
  }, [editOpen, variant])

  async function handleSave() {
    setCombinationError(null)
    for (const attribute of multi) {
      if (!selectedByAttributeId[attribute.attributeId]) {
        setCombinationError(tc('required'))
        return
      }
    }
    if (isDuplicate(attributes, selectedByAttributeId, existingVariants, variant.id)) {
      setCombinationError(t('variantDetail.attributeValues.duplicateCombination'))
      return
    }
    setSaving(true)
    try {
      const libraryValueIds = resolveLibraryValueIds(attributes, selectedByAttributeId)
      const updated = await companyCatalogApi.updateCopiedVariantAttributeValues(
        productId,
        variant.id,
        libraryValueIds,
      )
      onVariantUpdated(updated)
      toast({ title: t('variantDetail.attributeValues.saved') })
      setEditOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('variantDetail.attributeValues.saveFailed')
      if (message.includes('attribute combination already exists')) {
        setCombinationError(t('variantDetail.attributeValues.duplicateCombination'))
      } else {
        setCombinationError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <EditableSectionCard
        title={t('variantDetail.attributeValues.title')}
        description={t('variantDetail.attributeValues.description')}
        canEdit={canEdit && !loading}
        onEdit={() => setEditOpen(true)}
      >
        {variant.values.length === 0 ? (
          <Body className="text-sm text-muted">{t('variantDetail.attributeValues.empty')}</Body>
        ) : (
          <View className="gap-4">
            {variant.values.map((value) => (
              <ReadOnlyField
                key={`${value.attributeId}-${value.libraryValueId}`}
                label={value.attributeName}
                value={formatLibraryAttributeValueLabel(value, value.unitSymbol)}
              />
            ))}
          </View>
        )}
      </EditableSectionCard>
      <CustomDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={t('variantDetail.attributeValues.editTitle')}
        description={t('variantDetail.attributeValues.description')}
        footer={
          <View className="flex-row justify-end gap-2">
            <Button variant="outline" onPress={() => setEditOpen(false)} disabled={saving}>
              {tc('cancel')}
            </Button>
            <Button loading={saving} onPress={() => void handleSave()}>
              {tc('save')}
            </Button>
          </View>
        }
      >
        <View className="gap-4">
          {combinationError ? <Body className="text-destructive">{combinationError}</Body> : null}
          {multi.length === 0 ? (
            <Body className="text-sm text-muted">{t('variantDetail.attributeValues.empty')}</Body>
          ) : (
            multi.map((attribute) => (
              <NativeSelect
                key={attribute.attributeId}
                label={attribute.name}
                required
                value={selectedByAttributeId[attribute.attributeId] ?? ''}
                onValueChange={(libraryValueId) => {
                  setCombinationError(null)
                  setSelectedByAttributeId((current) => ({
                    ...current,
                    [attribute.attributeId]: libraryValueId,
                  }))
                }}
                placeholder={t('variantDetail.attributeValues.selectValue')}
                options={attribute.values
                  .filter((value) => value.libraryValueId)
                  .map((value) => ({
                    value: value.libraryValueId as string,
                    label: `${formatLibraryAttributeValueLabel(value, attribute.unit?.symbol ?? null)}${
                      value.isDefault ? ` (${t('attributeDetail.values.default')})` : ''
                    }`,
                  }))}
              />
            ))
          )}
        </View>
      </CustomDialog>
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Check, Plus, Trash2 } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Body,
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListAddButton,
  ListPageActions,
  SearchInput,
  useToast,
} from '@webonone/mobile-ui'
import { ProductVariantFormDialog } from '@/features/data/components/ProductVariantFormDialog'
import {
  companyCatalogApi,
  type CompanyCatalogVariant,
} from '@/features/data/services/companyCatalogApi'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
  type LibraryProductVariant,
} from '@/features/sales/services/dataLibraryApi'

function variantPickerSubtitle(
  t: TFunction<'catalog'>,
  variant: {
    sku: string
    isDefault?: boolean
    values: Array<{
      attributeName: string
      valueText: string | null
      valueNumber: number | null
      unitSymbol: string | null
    }>
  },
): string {
  const skuLine = [
    t('variantsTab.sku', { sku: variant.sku }),
    variant.isDefault ? t('variantDetail.variantCard.default') : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const valueLine =
    variant.values.length > 0
      ? variant.values
          .map(
            (value) =>
              `${value.attributeName}: ${formatLibraryAttributeValueLabel(value, value.unitSymbol)}`,
          )
          .join(' · ')
      : ''
  return [skuLine, valueLine].filter(Boolean).join('\n')
}

export function CompanyProductVariantPickerDialog({
  open,
  productId,
  productName,
  libraryEntityId,
  copiedVariants,
  onOpenChange,
  onCopied,
}: {
  open: boolean
  productId: string
  productName: string
  libraryEntityId: string | null
  copiedVariants: CompanyCatalogVariant[]
  onOpenChange: (open: boolean) => void
  onCopied: (libraryEntityId: string | null) => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [libraryVariants, setLibraryVariants] = useState<LibraryProductVariant[]>([])
  const [linkedLibraryId, setLinkedLibraryId] = useState<string | null>(libraryEntityId)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const copiedIds = useMemo(
    () => new Set(copiedVariants.map((variant) => variant.libraryVariantId)),
    [copiedVariants],
  )
  const busy = busyId != null

  async function loadLibraryVariants(libraryId: string) {
    const result = await dataLibraryApi.listProductVariants(libraryId)
    setLibraryVariants(result.items)
  }

  useEffect(() => {
    if (!open) return
    setQuery('')
    setLinkedLibraryId(libraryEntityId)
    if (!libraryEntityId) {
      setLibraryVariants([])
      return
    }
    let cancelled = false
    setLoading(true)
    void dataLibraryApi
      .listProductVariants(libraryEntityId)
      .then((result) => {
        if (!cancelled) setLibraryVariants(result.items)
      })
      .catch(() => {
        if (!cancelled) setLibraryVariants([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [libraryEntityId, open])

  const visibleLibrary = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return libraryVariants
    return libraryVariants.filter(
      (item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q),
    )
  }, [libraryVariants, query])

  async function copyIds(libraryVariantIds: string[]) {
    const toCopy = libraryVariantIds.filter((id) => !copiedIds.has(id))
    if (toCopy.length === 0) return
    setBusyId(toCopy[0] ?? 'copy')
    try {
      const result = await companyCatalogApi.copyVariantsFromLibrary(productId, toCopy)
      toast({ title: t('variantsTab.copied') })
      if (result.libraryEntityId) setLinkedLibraryId(result.libraryEntityId)
      onCopied(result.libraryEntityId)
    } catch (err) {
      toast({
        title: t('variantsTab.copyFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function removeVariant(variant: CompanyCatalogVariant) {
    if (variant.isDefault) return
    setBusyId(variant.id)
    try {
      await companyCatalogApi.deleteCopiedVariant(productId, variant.id)
      toast({ title: t('variantsTab.removed') })
      onCopied(linkedLibraryId)
    } catch (err) {
      toast({
        title: t('variantsTab.removeFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function openCreate() {
    setBusyId('create')
    try {
      const nextId =
        linkedLibraryId ??
        (await companyCatalogApi.ensureLibraryLink('products', productId)).libraryEntityId
      setLinkedLibraryId(nextId)
      onCopied(nextId)
      setCreateOpen(true)
    } catch (err) {
      toast({
        title: t('variantsTab.copyFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreated(libraryId: string) {
    setCreateOpen(false)
    setBusyId('refresh')
    try {
      await loadLibraryVariants(libraryId)
      onCopied(libraryId)
    } catch {
      onCopied(libraryId)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('variantsTab.addTitle')}
        description={t('variantsTab.addDescription')}
        sizeWidth="xlarge"
        sizeHeight="large"
        nestedDismissGuard={createOpen}
        footer={
          <View className="flex-row flex-nowrap justify-end gap-2">
            <Button variant="outline" onPress={() => onOpenChange(false)} disabled={busy}>
              {tc('close')}
            </Button>
          </View>
        }
      >
        <View className="gap-3">
          <View className="flex-col gap-4 sm:flex-row sm:items-start">
            <View className="min-w-0 flex-1 gap-2">
              <Body className="font-medium">{t('variantsTab.libraryColumn')}</Body>
              <ListPageActions>
                <SearchInput
                  value={query}
                  onChangeText={setQuery}
                  onClear={() => setQuery('')}
                  placeholder={t('variantsTab.search')}
                  editable={!busy}
                />
                <ListAddButton disabled={busy} onPress={() => void openCreate()}>
                  {t('variantsTab.addNewVariant')}
                </ListAddButton>
              </ListPageActions>
              {loading ? (
                <ItemListEmpty>{t('variantsTab.loading')}</ItemListEmpty>
              ) : visibleLibrary.length === 0 ? (
                <ItemListEmpty>
                  {linkedLibraryId ? t('variantsTab.pickerEmpty') : t('variantsTab.noLibraryProduct')}
                </ItemListEmpty>
              ) : (
                <ItemList>
                  {visibleLibrary.map((variant) => {
                    const alreadyCopied = copiedIds.has(variant.id)
                    return (
                      <ItemListItem key={variant.id}>
                        <ItemListContent
                          title={variant.name}
                          subtitle={variantPickerSubtitle(t, variant)}
                        />
                        {alreadyCopied ? (
                          <Check size={20} />
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={busy}
                            accessibilityLabel={t('variantsTab.addOne', { name: variant.name })}
                            onPress={() => void copyIds([variant.id])}
                          >
                            <Plus size={20} />
                          </Button>
                        )}
                      </ItemListItem>
                    )
                  })}
                </ItemList>
              )}
            </View>
            <View className="min-w-0 flex-1 gap-2">
              <Body className="font-medium">{t('variantsTab.companyColumn')}</Body>
              <View className="hidden h-12 sm:flex" aria-hidden />
              {copiedVariants.length === 0 ? (
                <ItemListEmpty>{t('variantsTab.companyColumnEmpty')}</ItemListEmpty>
              ) : (
                <ItemList>
                  {copiedVariants.map((variant) => (
                    <ItemListItem key={variant.id}>
                      <ItemListContent
                        title={variant.name}
                        subtitle={variantPickerSubtitle(t, variant)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={busy || variant.isDefault}
                        accessibilityLabel={t('variantsTab.removeOne', { name: variant.name })}
                        onPress={() => void removeVariant(variant)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </ItemListItem>
                  ))}
                </ItemList>
              )}
            </View>
          </View>
        </View>
      </CustomDialog>
      {createOpen && linkedLibraryId ? (
        <VariantCreateBridge
          productId={linkedLibraryId}
          productName={productName}
          onOpenChange={setCreateOpen}
          onCreated={() => void handleCreated(linkedLibraryId)}
        />
      ) : null}
    </>
  )
}

function VariantCreateBridge({
  productId,
  productName,
  onOpenChange,
  onCreated,
}: {
  productId: string
  productName: string
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [attributes, setAttributes] = useState<ReturnType<typeof parseLibraryAttributes>>([])
  const [existingIds, setExistingIds] = useState<string[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      dataLibraryApi.get('products', productId),
      dataLibraryApi.listProductVariants(productId),
    ]).then(([item, variants]) => {
      if (cancelled) return
      setAttributes(parseLibraryAttributes(item.attributes))
      setExistingIds(variants.items.map((entry) => entry.id))
    })
    return () => {
      cancelled = true
    }
  }, [productId])

  if (!existingIds) return null

  return (
    <ProductVariantFormDialog
      open
      productId={productId}
      productName={productName}
      attributes={attributes}
      hasDefaultVariant={existingIds.length > 0}
      onOpenChange={onOpenChange}
      onSaved={onCreated}
    />
  )
}

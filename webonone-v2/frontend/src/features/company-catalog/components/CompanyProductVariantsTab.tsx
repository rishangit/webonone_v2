import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListAddButton,
  StatusTag,
  StockAvailabilityProgress,
  useToast,
} from '@webonone/ui-kit'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { companyCatalogApi, type CompanyCatalogVariant } from '@/features/company-catalog/services/companyCatalogApi'
import { CompanyProductVariantCopyToAiMenuItem } from './CompanyProductVariantCopyToAiMenuItem'
import { CompanyProductVariantPickerDialog } from './CompanyProductVariantPickerDialog'
import { formatLibraryAttributeValueLabel } from '../services/dataLibraryApi'

const AI_PRODUCT_VARIANTS_CHANGED_EVENT = 'webonone:platform:ai-product-variants-changed'

type CompanyProductVariantsTabProps = {
  /** Company catalog product id (used for variant detail navigation). */
  productId: string
  productName: string
  libraryEntityId: string | null
  canAdd: boolean
}

export function CompanyProductVariantsTab({
  productId,
  productName,
  libraryEntityId,
  canAdd,
}: CompanyProductVariantsTabProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const navigate = useNavigate()
  const { byVariantId: stockLimitsByVariantId } = useCompanyProductVariantStockLimitsMap(productId)
  const [items, setItems] = useState<CompanyCatalogVariant[]>([])
  const [linkedLibraryId, setLinkedLibraryId] = useState<string | null>(libraryEntityId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [stockTotalsByVariantId, setStockTotalsByVariantId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CompanyCatalogVariant | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.listCopiedVariants(productId)
      setItems(result.items)
      setLinkedLibraryId(result.libraryEntityId ?? libraryEntityId)
      const totals = await Promise.all(
        result.items.map(async (variant) => {
          const stocks = await companyCatalogApi.listProductVariantStocks(productId, variant.id)
          const total = stocks.items.reduce((sum, item) => sum + item.quantity, 0)
          return [variant.id, total] as const
        }),
      )
      setStockTotalsByVariantId(Object.fromEntries(totals))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantsTab.failedLoad'))
      setItems([])
      setStockTotalsByVariantId({})
    } finally {
      setLoading(false)
    }
  }, [libraryEntityId, productId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    function onVariantsChanged() {
      void load()
    }
    window.addEventListener(AI_PRODUCT_VARIANTS_CHANGED_EVENT, onVariantsChanged)
    return () => window.removeEventListener(AI_PRODUCT_VARIANTS_CHANGED_EVENT, onVariantsChanged)
  }, [load])

  async function handleDeleteVariant(variant: CompanyCatalogVariant) {
    setBusy(true)
    setError(null)
    try {
      await companyCatalogApi.deleteCopiedVariant(productId, variant.id)
      toast({ title: t('variantsTab.removed') })
      setPendingDelete(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantDetail.deleteFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('variantsTab.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('variantsTab.copiedHint')}</p>
        </div>
        {canAdd ? (
          <ListAddButton
            className="self-end sm:self-auto"
            onClick={() => setPickerOpen(true)}
            disabled={loading || busy}
          >
            {t('variantsTab.add')}
          </ListAddButton>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!linkedLibraryId && items.length === 0 && !loading ? (
        <ItemListEmpty>{t('variantsTab.empty')}</ItemListEmpty>
      ) : loading && items.length === 0 ? (
        <ItemListEmpty>{t('variantsTab.loading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('variantsTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((variant) => {
            const rowBody = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{variant.name}</p>
                  {variant.isDefault ? (
                    <StatusTag variant="verified" className="shrink-0">
                      {t('variantDetail.variantCard.default')}
                    </StatusTag>
                  ) : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {t('variantsTab.sku', { sku: variant.sku })}
                </p>
                {variant.values.length > 0 ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {variant.values
                      .map(
                        (value) =>
                          `${value.attributeName}: ${formatLibraryAttributeValueLabel(value, value.unitSymbol)}`,
                      )
                      .join(' · ')}
                  </p>
                ) : null}
                {loading ? (
                  <p className="text-sm text-muted-foreground">{t('variantsTab.loadingStock')}</p>
                ) : (
                  <StockAvailabilityProgress
                    size="compact"
                    align="end"
                    quantity={stockTotalsByVariantId[variant.id] ?? 0}
                    maxQuantity={stockLimitsByVariantId[variant.id]?.maxQuantity}
                    minQuantity={stockLimitsByVariantId[variant.id]?.minQuantity}
                    caption={t('variantsTab.totalStock', {
                      quantity: (stockTotalsByVariantId[variant.id] ?? 0).toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      }),
                    })}
                  />
                )}
              </>
            )
            return (
              <ItemListItem key={variant.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      navigate(`/data/products/${productId}/variants/${variant.id}`)
                    }
                  >
                    {rowBody}
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={t('variantsTab.actionsFor', { name: variant.name })}>
                  <CompanyProductVariantCopyToAiMenuItem
                    productId={productId}
                    productName={productName}
                    variantId={variant.id}
                    variantName={variant.name}
                  />
                  {canAdd && !variant.isDefault ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={busy}
                      onClick={() => setPendingDelete(variant)}
                    >
                      {tc('delete')}
                    </DropdownMenuItem>
                  ) : null}
                </ItemListMenu>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}

      <CompanyProductVariantPickerDialog
        open={pickerOpen}
        productId={productId}
        libraryEntityId={linkedLibraryId}
        copiedVariants={items}
        onOpenChange={setPickerOpen}
        onCopied={(nextLibraryId) => {
          if (nextLibraryId) setLinkedLibraryId(nextLibraryId)
          void load()
        }}
      />

      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete
            ? t('variantDetail.deleteConfirm', { name: pendingDelete.name })
            : t('variantDetail.deleteConfirmFallback')
        }
        description={t('variantDetail.deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('delete')}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) {
            void handleDeleteVariant(pendingDelete)
          }
        }}
      />
    </div>
  )
}

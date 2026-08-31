import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@webonone/ui-kit'
import type { HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import { catalogItemImageUrl } from '@/features/company-catalog/utils/firstGalleryImageUrl'
import { dataLibraryApi } from '@/features/company-catalog/services/dataLibraryApi'
import type { PosCartLine, SaleItemKind } from '@/features/sales/types/sales.types'
import { resolveProductUnitPrice } from '@/features/sales/utils/formatMoney'
import {
  resolveStockedProductVariants,
  resolveStockedVariantUnitPrice,
  type StockedProductVariantOption,
} from '@/features/sales/utils/resolveStockedProductVariants'

type PendingProductPick = {
  item: HydratedCatalogItem
  options: StockedProductVariantOption[]
}

type UsePosProductPickOptions = {
  onAddLine: (line: PosCartLine) => void
}

function buildCartLine(
  item: HydratedCatalogItem,
  itemKind: SaleItemKind,
  unitPrice: number,
  selection?: StockedProductVariantOption,
): PosCartLine {
  return {
    key: `${item.id}-${Date.now()}`,
    itemKind,
    catalogItemId: item.id,
    name: item.displayName,
    quantity: 1,
    unitPrice,
    imageUrl: catalogItemImageUrl(item),
    libraryProductId: selection ? item.libraryEntityId : null,
    libraryVariantId: selection?.variant.id ?? null,
    libraryStockId: selection?.stock.id ?? null,
    variantName: selection?.variant.name ?? null,
    availableQuantity: selection?.stock.quantity ?? null,
  }
}

export function usePosProductPick({ onAddLine }: UsePosProductPickOptions) {
  const { t } = useTranslation('sales')
  const { toast } = useToast()
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [pendingPick, setPendingPick] = useState<PendingProductPick | null>(null)
  const [picking, setPicking] = useState(false)

  const addPlainProduct = useCallback(
    async (item: HydratedCatalogItem) => {
      let unitPrice = item.listPrice ?? 0
      const resolved = await resolveProductUnitPrice({
        listPrice: item.listPrice,
        libraryEntityId: item.libraryEntityId,
        loadVariants: (productId) => dataLibraryApi.listProductVariants(productId),
        loadStocks: (productId, variantId) =>
          dataLibraryApi.listProductVariantStocks(productId, variantId),
      })
      if (resolved != null) unitPrice = resolved
      onAddLine(buildCartLine(item, 'product', unitPrice))
    },
    [onAddLine],
  )

  const addWithSelection = useCallback(
    (item: HydratedCatalogItem, selection: StockedProductVariantOption) => {
      const unitPrice = resolveStockedVariantUnitPrice(item.listPrice, selection.stock)
      onAddLine(buildCartLine(item, 'product', unitPrice, selection))
    },
    [onAddLine],
  )

  const handlePick = useCallback(
    async (item: HydratedCatalogItem, itemKind: SaleItemKind) => {
      if (itemKind !== 'product' || !item.libraryEntityId) {
        onAddLine({
          key: `${item.id}-${Date.now()}`,
          itemKind,
          catalogItemId: item.id,
          name: item.displayName,
          quantity: 1,
          unitPrice: item.listPrice ?? 0,
          imageUrl: catalogItemImageUrl(item),
        })
        return
      }

      setPicking(true)
      try {
        const options = await resolveStockedProductVariants(item.libraryEntityId)
        if (options.length === 0) {
          await addPlainProduct(item)
          return
        }
        if (options.length === 1) {
          addWithSelection(item, options[0]!)
          return
        }
        setPendingPick({ item, options })
        setVariantDialogOpen(true)
      } catch (err) {
        toast({
          title: t('pos.variantPickerLoadFailed'),
          description: err instanceof Error ? err.message : undefined,
          variant: 'destructive',
        })
      } finally {
        setPicking(false)
      }
    },
    [addPlainProduct, addWithSelection, onAddLine, t, toast],
  )

  const confirmVariantSelection = useCallback(
    (selection: StockedProductVariantOption) => {
      if (!pendingPick) return
      addWithSelection(pendingPick.item, selection)
      setVariantDialogOpen(false)
      setPendingPick(null)
    },
    [addWithSelection, pendingPick],
  )

  const closeVariantDialog = useCallback((open: boolean) => {
    setVariantDialogOpen(open)
    if (!open) setPendingPick(null)
  }, [])

  return {
    handlePick,
    picking,
    variantDialogOpen,
    pendingPick,
    confirmVariantSelection,
    closeVariantDialog,
  }
}

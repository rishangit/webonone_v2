import { useCallback, useState } from 'react'
import { useToast } from '@webonone/mobile-ui'
import { dataLibraryApi } from '@/features/sales/services/dataLibraryApi'
import type { HydratedCatalogItem } from '@/features/sales/types/catalog.types'
import type { PosCartLine, SaleItemKind } from '@/features/sales/types/sales.types'
import { catalogItemImageUrl } from '@/features/sales/utils/catalogItemImageUrl'
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

export type PosProductPickResult = 'added' | 'variant-opened'

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
    async (item: HydratedCatalogItem, itemKind: SaleItemKind): Promise<PosProductPickResult> => {
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
        return 'added'
      }

      setPicking(true)
      try {
        const options = await resolveStockedProductVariants(item.libraryEntityId)
        if (options.length === 0) {
          await addPlainProduct(item)
          return 'added'
        }
        if (options.length === 1) {
          addWithSelection(item, options[0]!)
          return 'added'
        }
        setPendingPick({ item, options })
        setVariantDialogOpen(true)
        return 'variant-opened'
      } catch (err) {
        toast({
          title: 'Failed to load product variants',
          description: err instanceof Error ? err.message : undefined,
          variant: 'destructive',
        })
        return 'added'
      } finally {
        setPicking(false)
      }
    },
    [addPlainProduct, addWithSelection, onAddLine, toast],
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

import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Check } from 'lucide-react-native'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/mobile-ui'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import type { StockedProductVariantOption } from '@/features/sales/utils/resolveStockedProductVariants'

type PosProductVariantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  options: StockedProductVariantOption[]
  onConfirm: (selection: StockedProductVariantOption) => void
}

export function PosProductVariantDialog({
  open,
  onOpenChange,
  productName,
  options,
  onConfirm,
}: PosProductVariantDialogProps) {
  const [selected, setSelected] = useState<StockedProductVariantOption | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setSelected(null)
    onOpenChange(next)
  }

  function handleConfirm() {
    if (!selected) return
    onConfirm(selected)
    setSelected(null)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Select variant"
      description={`Choose a variant for ${productName}.`}
      sizeWidth="large"
      sizeHeight="large"
      footer={
        <View className="flex-row justify-end gap-2">
          <Button variant="outline" onPress={() => handleOpenChange(false)}>Cancel</Button>
          <Button disabled={!selected} onPress={handleConfirm}>Add to sale</Button>
        </View>
      }
    >
      {options.length === 0 ? (
        <ItemListEmpty>No stocked variants available.</ItemListEmpty>
      ) : (
        <ItemList>
          {options.map((option) => {
            const isSelected = selected?.variant.id === option.variant.id
            return (
              <ItemListItem key={option.variant.id} selected={isSelected}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelected(option)}
                  className="flex-1 flex-row items-center gap-3"
                >
                  <ItemListContent
                    title={option.variant.name}
                    subtitle={`SKU: ${option.variant.sku} · Available: ${option.stock.quantity} · ${formatLkr(option.stock.sellPrice)}`}
                  />
                  {isSelected ? (
                    <Check size={20} className="text-primary" color="currentColor" />
                  ) : null}
                </Pressable>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </CustomDialog>
  )
}

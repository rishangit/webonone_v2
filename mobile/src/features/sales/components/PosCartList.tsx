import { View } from 'react-native'
import {
  Body,
  ImagePreview,
  ItemList,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  Muted,
  Subheading,
  TextField,
  itemListThumbClassName,
} from '@webonone/mobile-ui'
import type { PosCartLine } from '@/features/sales/types/sales.types'
import { formatLkr } from '@/features/sales/utils/formatMoney'

const KIND_LABEL: Record<PosCartLine['itemKind'], string> = {
  product: 'Product',
  service: 'Service',
  space: 'Space',
}

type PosCartListProps = {
  lines: PosCartLine[]
  onQuantityChange?: (key: string, quantity: number) => void
  onUnitPriceChange?: (key: string, unitPrice: number) => void
  onRemove?: (key: string) => void
}

export function PosCartList({ lines, onQuantityChange, onUnitPriceChange, onRemove }: PosCartListProps) {
  if (lines.length === 0) {
    return <ItemListEmpty>No items in this sale yet.</ItemListEmpty>
  }

  return (
    <ItemList>
      {lines.map((line) => (
        <ItemListItem key={line.key}>
          <View className="min-w-0 flex-1 gap-3">
            <View className="flex-row items-start gap-3">
              <ImagePreview
                src={line.imageUrl ?? null}
                alt={line.name}
                className={itemListThumbClassName}
              />
              <View className="min-w-0 flex-1 gap-1">
                <Subheading className="text-sm">{line.name}</Subheading>
                {line.variantName ? <Muted className="text-xs">{line.variantName}</Muted> : null}
                <Muted className="text-xs">{KIND_LABEL[line.itemKind]}</Muted>
              </View>
            </View>
            <View className="flex-row flex-wrap items-end gap-3">
              <View className="min-w-[88px] flex-1">
                <TextField
                  label="Qty"
                  value={String(line.quantity)}
                  onChangeText={(value) => onQuantityChange?.(line.key, Number(value))}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="min-w-[112px] flex-1">
                <TextField
                  label="Unit (LKR)"
                  value={String(line.unitPrice)}
                  onChangeText={(value) => onUnitPriceChange?.(line.key, Number(value))}
                  keyboardType="decimal-pad"
                />
              </View>
              <Body className="pb-2 text-sm font-semibold">
                {formatLkr(line.quantity * line.unitPrice)}
              </Body>
            </View>
          </View>
          <ItemListMenu ariaLabel={`Actions for ${line.name}`}>
            <ItemListMenuItem destructive onPress={() => onRemove?.(line.key)}>
              Remove
            </ItemListMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

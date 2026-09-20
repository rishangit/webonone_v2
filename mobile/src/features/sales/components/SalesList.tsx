import { Pressable, View } from 'react-native'
import {
  ItemList,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  Muted,
  StatusTag,
  Subheading,
} from '@webonone/mobile-ui'
import type { SaleListItem } from '@/features/sales/types/sales.types'
import { formatLkr, formatSaleWhen } from '@/features/sales/utils/formatMoney'

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
}

type SalesListProps = {
  items: SaleListItem[]
  emptyMessage?: string
  onOpen: (saleId: string) => void
}

export function SalesList({ items, emptyMessage = 'No sales yet.', onOpen }: SalesListProps) {
  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((sale) => (
        <ItemListItem key={sale.id}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen(sale.id)}
            className="min-w-0 flex-1 gap-2"
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="min-w-0 flex-1 gap-1">
                <Subheading className="text-sm">{sale.billNumber ?? 'Draft'}</Subheading>
                <Muted className="text-xs">
                  {sale.customerDisplayName} · {formatLkr(sale.total, sale.currency)}
                  {sale.paymentMethod ? ` · ${PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}` : ''}
                </Muted>
                <Muted className="text-xs">{formatSaleWhen(sale.createdAt)}</Muted>
              </View>
              <StatusTag variant={sale.status === 'completed' ? 'verified' : 'pending'}>
                {sale.status === 'completed' ? 'Completed' : 'Void'}
              </StatusTag>
            </View>
          </Pressable>
          <ItemListMenu ariaLabel={`Actions for ${sale.billNumber ?? sale.id}`}>
            <ItemListMenuItem onPress={() => onOpen(sale.id)}>View bill</ItemListMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

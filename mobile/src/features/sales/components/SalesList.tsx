import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  ImagePreview,
  ItemList,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  itemListThumbSmClassName,
  Muted,
  PriceDisplay,
  StatusTag,
  Subheading,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import type { SaleListItem } from '@/features/sales/types/sales.types'
import { formatSaleWhen } from '@/features/sales/utils/formatMoney'
import { overlaySaleCustomerFromSessionUser } from '@/shared/utils/overlayIdentityFromSessionUser'

type SalesListProps = {
  items: SaleListItem[]
  emptyMessage?: string
  onOpen: (saleId: string) => void
}

export function SalesList({ items, emptyMessage = 'No sales yet.', onOpen }: SalesListProps) {
  const { t } = useTranslation('sales')
  const { user: sessionUser } = useSession()

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  function paymentLabel(method: SaleListItem['paymentMethod']) {
    if (!method) return null
    return t(`payment.${method}`)
  }

  function saleMetaLine(sale: SaleListItem) {
    const payment = paymentLabel(sale.paymentMethod)
    const parts = [sale.customerDisplayName]
    if (payment) parts.push(payment)
    return parts.join(' · ')
  }

  return (
    <ItemList>
      {items.map((raw) => {
        const sale = overlaySaleCustomerFromSessionUser(raw, sessionUser)
        return (
        <ItemListItem key={sale.id}>
          <ImagePreview
            src={sale.customerAvatarUrl ?? undefined}
            alt={sale.customerDisplayName}
            className={`mr-3 ${itemListThumbSmClassName}`}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen(sale.id)}
            className="min-w-0 flex-1"
          >
            <View className="flex-row items-stretch gap-2">
              <View className="min-w-0 flex-1 gap-1">
                <Subheading className="text-sm">{sale.billNumber ?? t('status.draft')}</Subheading>
                <Muted className="text-xs">{saleMetaLine(sale)}</Muted>
                <Muted className="text-xs">{formatSaleWhen(sale.createdAt)}</Muted>
              </View>
              <View className="shrink-0 items-end gap-2 self-stretch">
                <StatusTag variant={sale.status === 'completed' ? 'verified' : 'pending'}>
                  {sale.status === 'completed' ? t('status.completed') : t('status.void')}
                </StatusTag>
                <PriceDisplay
                  value={sale.total}
                  currency={sale.currency}
                  size="sm"
                  className="mt-auto"
                />
              </View>
            </View>
          </Pressable>
          <ItemListMenu ariaLabel={`Actions for ${sale.billNumber ?? sale.id}`}>
            <ItemListMenuItem onPress={() => onOpen(sale.id)}>{t('history.viewBill')}</ItemListMenuItem>
          </ItemListMenu>
        </ItemListItem>
        )
      })}
    </ItemList>
  )
}

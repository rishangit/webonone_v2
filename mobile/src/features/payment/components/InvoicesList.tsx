import { Pressable, View } from 'react-native'
import {
  Body,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  StatusTag,
  itemListThumbClassName,
} from '@webonone/mobile-ui'
import type { InvoiceListItem, InvoiceStatus } from '@/features/payment/types/payment.types'
import {
  formatInvoiceDate,
  formatInvoicePeriod,
  formatLkr,
} from '@/features/payment/utils/formatInvoiceMoney'
import { invoiceStatusLabel, invoiceStatusVariant } from '@/features/payment/utils/invoiceStatus'

type InvoicesListProps = {
  items: InvoiceListItem[]
  emptyMessage: string
  isSuperAdmin: boolean
  onOpen: (invoiceId: string) => void
  onMarkPaid?: (invoice: InvoiceListItem) => void
  onRejectProof?: (invoice: InvoiceListItem) => void
  onVoid?: (invoice: InvoiceListItem) => void
}

function canMarkPaid(status: InvoiceStatus): boolean {
  return status === 'issued' || status === 'overdue' || status === 'pending_verification'
}

export function InvoicesList({
  items,
  emptyMessage,
  isSuperAdmin,
  onOpen,
  onMarkPaid,
  onRejectProof,
  onVoid,
}: InvoicesListProps) {
  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((invoice) => {
        const companyName = invoice.companyName?.trim() || 'Unknown company'
        const subtitle = `${invoice.invoiceNumber} · Ref ${invoice.paymentReference}`
        const meta = `${formatInvoicePeriod(invoice.periodStart, invoice.periodEnd)} · ${formatLkr(invoice.amountMinor)} · Due ${formatInvoiceDate(invoice.dueAt)}`

        return (
          <ItemListItem key={invoice.id}>
            <Pressable className="min-w-0 flex-1 flex-row items-start gap-3" onPress={() => onOpen(invoice.id)}>
              <ImagePreview src={invoice.companyLogoUrl} alt={companyName} className={itemListThumbClassName} />
              <View className="min-w-0 flex-1 gap-1">
                <ItemListContent title={companyName} subtitle={subtitle} />
                <Body className="text-sm text-muted">{meta}</Body>
                <StatusTag variant={invoiceStatusVariant(invoice.status)}>
                  {invoiceStatusLabel(invoice.status)}
                </StatusTag>
              </View>
            </Pressable>
            <ItemListMenu ariaLabel={`Actions for ${companyName}`}>
              <ItemListMenuItem onPress={() => onOpen(invoice.id)}>View</ItemListMenuItem>
              {isSuperAdmin && canMarkPaid(invoice.status) ? (
                <ItemListMenuItem onPress={() => onMarkPaid?.(invoice)}>Mark paid</ItemListMenuItem>
              ) : null}
              {isSuperAdmin && invoice.status === 'pending_verification' ? (
                <ItemListMenuItem onPress={() => onRejectProof?.(invoice)}>Reject proof</ItemListMenuItem>
              ) : null}
              {isSuperAdmin && invoice.status !== 'paid' && invoice.status !== 'void' ? (
                <>
                  <ItemListMenuSeparator />
                  <ItemListMenuItem destructive onPress={() => onVoid?.(invoice)}>
                    Void
                  </ItemListMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}

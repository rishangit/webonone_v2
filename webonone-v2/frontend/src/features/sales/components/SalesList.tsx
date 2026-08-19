import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import type { SaleListItem } from '@/features/sales/types/sales.types'
import { formatLkr, formatSaleWhen } from '@/features/sales/utils/formatMoney'

type SalesListProps = {
  items: SaleListItem[]
}

export function SalesList({ items }: SalesListProps) {
  const { t } = useTranslation('sales')
  const navigate = useNavigate()
  const rows = Array.isArray(items) ? items : []
  if (rows.length === 0) {
    return <ItemListEmpty>{t('history.empty')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {rows.map((sale) => (
        <ItemListItem key={sale.id}>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => navigate(`/sales/${sale.id}`)}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">{sale.billNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.customerDisplayName} · {formatLkr(sale.total, sale.currency)} ·{' '}
                    {t(`payment.${sale.paymentMethod}`)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatSaleWhen(sale.createdAt)}</p>
                </div>
                <StatusTag variant={sale.status === 'completed' ? 'verified' : 'pending'}>
                  {sale.status === 'completed' ? t('status.completed') : t('status.void')}
                </StatusTag>
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel={t('pos.lineActionsAria', { name: sale.billNumber })}>
            <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}`)}>
              {t('history.viewBill')}
            </DropdownMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

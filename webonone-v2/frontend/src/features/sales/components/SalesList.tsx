import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  DropdownMenuItem,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
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
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const rows = Array.isArray(items) ? items : []

  const columns = useMemo(
    () => [
      {
        id: 'bill',
        header: t('history.columnBill'),
        sortable: true,
        compare: (a: SaleListItem, b: SaleListItem) =>
          (a.billNumber ?? a.id).localeCompare(b.billNumber ?? b.id, undefined, {
            sensitivity: 'base',
          }),
        cell: (item: SaleListItem) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => navigate(`/sales/${item.id}`)}
          >
            {item.billNumber ?? t('status.draft')}
          </button>
        ),
      },
      {
        id: 'total',
        header: t('history.columnTotal'),
        cell: (item: SaleListItem) => formatLkr(item.total, item.currency),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (item: SaleListItem) => (
          <StatusTag variant={item.status === 'completed' ? 'verified' : 'pending'}>
            {item.status === 'completed' ? t('status.completed') : t('status.void')}
          </StatusTag>
        ),
      },
    ],
    [navigate, t, tc],
  )

  function renderRowMenu(item: SaleListItem) {
    return (
      <ItemListMenu ariaLabel={t('pos.lineActionsAria', { name: item.billNumber ?? item.id })}>
        <DropdownMenuItem onClick={() => navigate(`/sales/${item.id}`)}>
          {t('history.viewBill')}
        </DropdownMenuItem>
      </ItemListMenu>
    )
  }

  function rowBody(item: SaleListItem) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{item.billNumber ?? t('status.draft')}</p>
          <p className="text-xs text-muted-foreground">
            {item.customerDisplayName} · {formatLkr(item.total, item.currency)}
            {item.paymentMethod ? ` · ${t(`payment.${item.paymentMethod}`)}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">{formatSaleWhen(item.createdAt)}</p>
        </div>
        <StatusTag variant={item.status === 'completed' ? 'verified' : 'pending'}>
          {item.status === 'completed' ? t('status.completed') : t('status.void')}
        </StatusTag>
      </div>
    )
  }

  return (
    <CollectionListView
      items={rows}
      getRowKey={(item) => item.id}
      columns={columns}
      empty={<ItemListEmpty>{t('history.empty')}</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      renderListItem={(item) => (
        <ItemListItem>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => navigate(`/sales/${item.id}`)}
            >
              {rowBody(item)}
            </button>
          </ItemListContent>
          {renderRowMenu(item)}
        </ItemListItem>
      )}
      renderCard={(item) => (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage />}
          menu={renderRowMenu(item)}
          onBodyClick={() => navigate(`/sales/${item.id}`)}
        >
          {rowBody(item)}
        </ItemListCollectionCard>
      )}
    />
  )
}

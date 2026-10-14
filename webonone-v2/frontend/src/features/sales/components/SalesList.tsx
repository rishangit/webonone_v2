import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  DropdownMenuItem,
  ImagePreview,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
  PriceDisplay,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import type { SaleListItem } from '@/features/sales/types/sales.types'
import { overlayIdentityFromSessionUser } from '@/shared/utils/overlayIdentityFromSessionUser'
import { formatSaleWhen } from '@/features/sales/utils/formatMoney'

type SalesListProps = {
  items: SaleListItem[]
}

export function SalesList({ items }: SalesListProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const sessionUser = useAppSelector((s) => s.auth.user)
  const rows = useMemo(
    () =>
      (Array.isArray(items) ? items : []).map((item) =>
        overlayIdentityFromSessionUser(item, sessionUser, {
          userId: 'customerUserId',
          displayName: 'customerDisplayName',
          email: 'customerEmail',
          avatarUrl: 'customerAvatarUrl',
        }),
      ),
    [items, sessionUser],
  )

  const gridThumbClassName = 'h-10 w-10 shrink-0 rounded-md'

  const openBill = useCallback((id: string) => {
    navigate(`/sales/${id}`)
  }, [navigate])

  function paymentLabel(method: SaleListItem['paymentMethod']) {
    if (!method) return null
    return t(`payment.${method}`)
  }

  function saleMetaLine(item: SaleListItem) {
    const payment = paymentLabel(item.paymentMethod)
    const parts = [item.customerDisplayName]
    if (payment) parts.push(payment)
    return parts.join(' · ')
  }

  const columns = useMemo(
    () => [
      {
        id: 'avatar',
        header: '',
        className: 'w-14',
        cell: (item: SaleListItem) => (
          <ImagePreview
            src={item.customerAvatarUrl ?? null}
            alt={item.customerDisplayName}
            mode="view"
            className={gridThumbClassName}
          />
        ),
      },
      {
        id: 'customer',
        header: t('history.columnCustomer'),
        sortable: true,
        compare: (a: SaleListItem, b: SaleListItem) =>
          a.customerDisplayName.localeCompare(b.customerDisplayName, undefined, {
            sensitivity: 'base',
          }),
        cell: (item: SaleListItem) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openBill(item.id)}
          >
            {item.customerDisplayName}
          </button>
        ),
      },
      {
        id: 'bill',
        header: t('history.columnBill'),
        sortable: true,
        compare: (a: SaleListItem, b: SaleListItem) =>
          (a.billNumber ?? a.id).localeCompare(b.billNumber ?? b.id, undefined, {
            sensitivity: 'base',
          }),
        cell: (item: SaleListItem) => (
          <span className="text-muted-foreground">{item.billNumber ?? t('status.draft')}</span>
        ),
      },
      {
        id: 'payment',
        header: t('history.columnPayment'),
        cell: (item: SaleListItem) => (
          <span className="text-muted-foreground">
            {paymentLabel(item.paymentMethod) ?? '—'}
          </span>
        ),
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
      {
        id: 'total',
        header: t('history.columnTotal'),
        align: 'right' as const,
        cell: (item: SaleListItem) => (
          <PriceDisplay value={item.total} currency={item.currency} size="sm" align="right" />
        ),
      },
    ],
    [gridThumbClassName, openBill, t, tc],
  )

  function renderRowMenu(item: SaleListItem) {
    return (
      <ItemListMenu ariaLabel={t('pos.lineActionsAria', { name: item.billNumber ?? item.id })}>
        <DropdownMenuItem onClick={() => openBill(item.id)}>{t('history.viewBill')}</DropdownMenuItem>
      </ItemListMenu>
    )
  }

  function listAside(item: SaleListItem) {
    return (
      <div className="ml-auto flex shrink-0 flex-col items-end gap-2 self-stretch">
        <StatusTag variant={item.status === 'completed' ? 'verified' : 'pending'}>
          {item.status === 'completed' ? t('status.completed') : t('status.void')}
        </StatusTag>
        <PriceDisplay
          value={item.total}
          currency={item.currency}
          size="sm"
          align="right"
          className="mt-auto"
        />
      </div>
    )
  }

  function rowBody(item: SaleListItem) {
    return (
      <div className="flex w-full items-stretch gap-3">
        <ImagePreview
          src={item.customerAvatarUrl ?? null}
          alt={item.customerDisplayName}
          mode="view"
          className={itemListThumbClassName}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">{item.billNumber ?? t('status.draft')}</p>
          <p className="text-xs text-muted-foreground">{saleMetaLine(item)}</p>
          <p className="text-xs text-muted-foreground">{formatSaleWhen(item.createdAt)}</p>
        </div>
        {listAside(item)}
      </div>
    )
  }

  return (
    <CollectionListView
      cardLayout={false}
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
              onClick={() => openBill(item.id)}
            >
              {rowBody(item)}
            </button>
          </ItemListContent>
          {renderRowMenu(item)}
        </ItemListItem>
      )}
    />
  )
}

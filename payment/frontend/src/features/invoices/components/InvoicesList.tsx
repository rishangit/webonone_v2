import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  DropdownMenuItem,
  ImagePreview,
  ItemListCollectionCard,
  itemListCardImageClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
  StatusTag,
} from '@webonone/ui-kit'
import type { InvoiceListItem, InvoiceStatus } from '@/shared/types/payment.types'
import { formatDate, formatLkr, formatPeriod } from '@/shared/utils/money'

function statusVariant(status: InvoiceStatus): 'pending' | 'approved' | 'rejected' {
  if (status === 'paid') return 'approved'
  if (status === 'overdue' || status === 'void') return 'rejected'
  return 'pending'
}

function statusLabelKey(status: InvoiceStatus): string {
  switch (status) {
    case 'issued':
      return 'statusIssued'
    case 'paid':
      return 'statusPaid'
    case 'overdue':
      return 'statusOverdue'
    case 'void':
      return 'statusVoid'
    case 'pending_verification':
      return 'statusPendingReview'
    default:
      return status
  }
}

type InvoicesListProps = {
  rows: InvoiceListItem[]
  role: string | undefined
  onOpen: (id: string) => void
  onMarkPaid: (invoice: InvoiceListItem) => void
  onRejectProof: (invoice: InvoiceListItem) => void
  onVoid: (invoice: InvoiceListItem) => void
}

export function InvoicesList({
  rows,
  role,
  onOpen,
  onMarkPaid,
  onRejectProof,
  onVoid,
}: InvoicesListProps) {
  const { t } = useTranslation('invoices')
  const { t: tc } = useTranslation('common')

  const columns = useMemo(
    () => [
      {
        id: 'company',
        header: tc('name'),
        sortable: true,
        compare: (a: InvoiceListItem, b: InvoiceListItem) =>
          (a.companyName || '').localeCompare(b.companyName || '', undefined, { sensitivity: 'base' }),
        cell: (invoice: InvoiceListItem) => invoice.companyName?.trim() || t('unknownCompany'),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (invoice: InvoiceListItem) => (
          <StatusTag variant={statusVariant(invoice.status)}>
            {t(statusLabelKey(invoice.status))}
          </StatusTag>
        ),
      },
    ],
    [t, tc],
  )

  function renderRowMenu(invoice: InvoiceListItem) {
    return (
      <ItemListMenu
        ariaLabel={t('actionsFor', {
          name: invoice.companyName || invoice.invoiceNumber,
        })}
      >
        <DropdownMenuItem onClick={() => onOpen(invoice.id)}>{tc('view')}</DropdownMenuItem>
        {role === 'super_admin' &&
        (invoice.status === 'issued' ||
          invoice.status === 'overdue' ||
          invoice.status === 'pending_verification') ? (
          <DropdownMenuItem onClick={() => onMarkPaid(invoice)}>{t('markPaid')}</DropdownMenuItem>
        ) : null}
        {role === 'super_admin' && invoice.status === 'pending_verification' ? (
          <DropdownMenuItem onClick={() => onRejectProof(invoice)}>{t('rejectProof')}</DropdownMenuItem>
        ) : null}
        {role === 'super_admin' && invoice.status !== 'paid' && invoice.status !== 'void' ? (
          <DropdownMenuItem onClick={() => onVoid(invoice)}>{t('voidAction')}</DropdownMenuItem>
        ) : null}
      </ItemListMenu>
    )
  }

  function invoiceDetails(invoice: InvoiceListItem) {
    return (
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">
            {invoice.companyName?.trim() || t('unknownCompany')}
          </p>
          <StatusTag variant={statusVariant(invoice.status)}>
            {t(statusLabelKey(invoice.status))}
          </StatusTag>
        </div>
        <p className="text-xs text-muted-foreground">
          {invoice.invoiceNumber} · {t('refLabel', { ref: invoice.paymentReference })}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPeriod(invoice.periodStart, invoice.periodEnd)}
        </p>
        <p className="text-sm">
          {formatLkr(invoice.amountMinor)} · {t('dueLabel', { date: formatDate(invoice.dueAt) })}
        </p>
      </div>
    )
  }

  function rowBody(invoice: InvoiceListItem) {
    return (
      <div className="flex items-start gap-3">
        <ImagePreview
          src={invoice.companyLogoUrl}
          alt={invoice.companyName?.trim() || t('unknownCompany')}
          mode="view"
          className={itemListThumbClassName}
        />
        {invoiceDetails(invoice)}
      </div>
    )
  }

  return (
    <CollectionListView
      items={rows}
      getRowKey={(invoice) => invoice.id}
      columns={columns}
      empty={<ItemListEmpty>{t('empty')}</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      renderListItem={(invoice) => (
        <ItemListItem>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onOpen(invoice.id)}
            >
              {rowBody(invoice)}
            </button>
          </ItemListContent>
          {renderRowMenu(invoice)}
        </ItemListItem>
      )}
      renderCard={(invoice) => (
        <ItemListCollectionCard
          image={
            <ImagePreview
              src={invoice.companyLogoUrl}
              alt={invoice.companyName?.trim() || t('unknownCompany')}
              mode="view"
              className={itemListCardImageClassName}
            />
          }
          menu={renderRowMenu(invoice)}
          onBodyClick={() => onOpen(invoice.id)}
        >
          {invoiceDetails(invoice)}
        </ItemListCollectionCard>
      )}
    />
  )
}

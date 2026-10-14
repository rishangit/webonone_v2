import { useMemo } from 'react'
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
import type { InvoiceListItem, InvoiceStatus } from '@/shared/types/payment.types'
import { formatDate, formatPeriod } from '@/shared/utils/money'

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
  const { t, i18n } = useTranslation('invoices')
  const { t: tc } = useTranslation('common')
  const locale = i18n.language

  const columns = useMemo(
    () => [
      {
        id: 'company',
        header: t('company'),
        sortable: true,
        compare: (a: InvoiceListItem, b: InvoiceListItem) =>
          (a.companyName || '').localeCompare(b.companyName || '', undefined, { sensitivity: 'base' }),
        cell: (invoice: InvoiceListItem) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpen(invoice.id)}
          >
            {invoice.companyName?.trim() || t('unknownCompany')}
          </button>
        ),
      },
      {
        id: 'reference',
        header: t('columnReference'),
        sortable: true,
        compare: (a: InvoiceListItem, b: InvoiceListItem) =>
          a.paymentReference.localeCompare(b.paymentReference, undefined, { sensitivity: 'base' }),
        cell: (invoice: InvoiceListItem) => (
          <span className="font-mono text-xs text-muted-foreground">{invoice.paymentReference}</span>
        ),
      },
      {
        id: 'period',
        header: t('period'),
        sortable: true,
        compare: (a: InvoiceListItem, b: InvoiceListItem) =>
          a.periodStart.localeCompare(b.periodStart, undefined, { sensitivity: 'base' }),
        cell: (invoice: InvoiceListItem) => (
          <span className="text-muted-foreground">
            {formatPeriod(invoice.periodStart, invoice.periodEnd)}
          </span>
        ),
      },
      {
        id: 'issued',
        header: t('issuedLabel'),
        sortable: true,
        compare: (a: InvoiceListItem, b: InvoiceListItem) =>
          a.issuedAt.localeCompare(b.issuedAt, undefined, { sensitivity: 'base' }),
        cell: (invoice: InvoiceListItem) => (
          <span className="text-muted-foreground">{formatDate(invoice.issuedAt, locale)}</span>
        ),
      },
      {
        id: 'due',
        header: t('due'),
        sortable: true,
        compare: (a: InvoiceListItem, b: InvoiceListItem) =>
          a.dueAt.localeCompare(b.dueAt, undefined, { sensitivity: 'base' }),
        cell: (invoice: InvoiceListItem) => (
          <span className="text-muted-foreground">{formatDate(invoice.dueAt, locale)}</span>
        ),
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
      {
        id: 'amount',
        header: t('amount'),
        align: 'right' as const,
        sortable: true,
        compare: (a: InvoiceListItem, b: InvoiceListItem) => a.amountMinor - b.amountMinor,
        cell: (invoice: InvoiceListItem) => (
          <PriceDisplay value={invoice.amountMinor} currency={invoice.currency} minorUnits size="sm" align="right" />
        ),
      },
    ],
    [locale, onOpen, t, tc],
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

  function listAside(invoice: InvoiceListItem) {
    return (
      <div className="ml-auto flex shrink-0 flex-col items-end gap-2 self-stretch">
        <StatusTag variant={statusVariant(invoice.status)}>
          {t(statusLabelKey(invoice.status))}
        </StatusTag>
        <PriceDisplay
          value={invoice.amountMinor}
          currency={invoice.currency}
          minorUnits
          size="sm"
          align="right"
          className="mt-auto"
        />
      </div>
    )
  }

  function invoiceDetails(invoice: InvoiceListItem) {
    return (
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium">
          {invoice.companyName?.trim() || t('unknownCompany')}
        </p>
        <p className="text-xs text-muted-foreground">
          {invoice.invoiceNumber} · {t('refLabel', { ref: invoice.paymentReference })}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPeriod(invoice.periodStart, invoice.periodEnd)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('dueLabel', { date: formatDate(invoice.dueAt, locale) })}
        </p>
      </div>
    )
  }

  function rowBody(invoice: InvoiceListItem) {
    return (
      <div className="flex w-full items-stretch gap-3">
        <ImagePreview
          src={invoice.companyLogoUrl}
          alt={invoice.companyName?.trim() || t('unknownCompany')}
          mode="view"
          className={itemListThumbClassName}
        />
        {invoiceDetails(invoice)}
        {listAside(invoice)}
      </div>
    )
  }

  return (
    <CollectionListView
      cardLayout={false}
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
    />
  )
}

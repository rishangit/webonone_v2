import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  DropdownMenuItem,
  FeaturePage,
  FormField,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  ListPageFooter,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { invoicesActions } from '@/features/invoices/store'
import { paymentApi } from '@/shared/services/paymentApi'
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

export function InvoicesPage() {
  const { t } = useTranslation('invoices')
  const { t: tc } = useTranslation('common')

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const role = useAppSelector((s) => s.auth.user?.role)
  const { items, total, page, pageSize, listStatus, listError } = useAppSelector((s) => s.invoices)

  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({ status: 'all', q: '' })
  const [actionError, setActionError] = useState<string | null>(null)

  const loading = listStatus === 'loading' && items.length === 0
  usePlatformLoading(loading ? t('loading') : null)

  const hasActiveFilters = appliedFilters.status !== 'all'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch(
        invoicesActions.loadListRequested({
          page: 1,
          pageSize,
          status: appliedFilters.status,
          extra: { q: appliedFilters.q.trim() || undefined },
          force: true,
        }),
      )
    }, 300)
    return () => window.clearTimeout(timer)
  }, [appliedFilters, dispatch, pageSize])

  function reload(nextPage = page) {
    dispatch(
      invoicesActions.loadListRequested({
        page: nextPage,
        pageSize,
        status: appliedFilters.status,
        extra: { q: appliedFilters.q.trim() || undefined },
        force: true,
      }),
    )
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setAppliedFilters((prev) => ({ ...prev, q: value }))
  }

  async function markPaid(invoice: InvoiceListItem) {
    setActionError(null)
    try {
      await paymentApi.markPaid(invoice.id)
      toast({ title: t('markedPaid') })
      reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedMarkPaid')
      setActionError(message)
      toast({ title: t('failedMarkPaid'), description: message, variant: 'destructive' })
    }
  }

  async function rejectProof(invoice: InvoiceListItem) {
    setActionError(null)
    try {
      await paymentApi.rejectPaymentProof(invoice.id)
      toast({ title: t('proofRejected') })
      reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedRejectProof')
      setActionError(message)
      toast({ title: t('failedRejectProof'), description: message, variant: 'destructive' })
    }
  }

  async function voidInvoice(invoice: InvoiceListItem) {
    setActionError(null)
    try {
      await paymentApi.voidInvoice(invoice.id)
      toast({ title: t('voided') })
      reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedVoid')
      setActionError(message)
      toast({ title: t('failedVoid'), description: message, variant: 'destructive' })
    }
  }

  const rows = Array.isArray(items) ? items : []
  const isCompanyAdmin = role === 'company_admin'

  return (
    <FeaturePage
      title={t('title')}
      description={isCompanyAdmin ? t('descriptionCompany') : t('descriptionAdmin')}
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={isCompanyAdmin ? t('searchPlaceholderCompany') : t('searchPlaceholderAdmin')}
            onClear={() => handleSearchChange('')}
            aria-label={t('search')}
            className="w-64"
          />
          <ListFilterTrigger active={hasActiveFilters || filterOpen} onClick={() => setFilterOpen(true)} />
        </div>
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={() => {
          setAppliedFilters((prev) => ({ ...prev, status }))
          setFilterOpen(false)
        }}
        onClear={() => {
          setStatus('all')
          setAppliedFilters((prev) => ({ ...prev, status: 'all' }))
          setFilterOpen(false)
        }}
      >
        <FormField label={tc('status')} htmlFor="invoice-status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="invoice-status">
              <SelectValue placeholder={tc('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('all')}</SelectItem>
              <SelectItem value="issued">{t('statusIssued')}</SelectItem>
              <SelectItem value="pending_verification">{t('statusPendingReview')}</SelectItem>
              <SelectItem value="paid">{t('statusPaid')}</SelectItem>
              <SelectItem value="overdue">{t('statusOverdue')}</SelectItem>
              <SelectItem value="void">{t('statusVoid')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      {(listError || actionError) && (
        <Alert variant="destructive">
          <AlertDescription>{listError ?? actionError}</AlertDescription>
        </Alert>
      )}

      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            {rows.length === 0 ? (
              <ItemListEmpty>{t('empty')}</ItemListEmpty>
            ) : (
              <ItemList>
                {rows.map((invoice) => (
                  <ItemListItem key={invoice.id}>
                    <ItemListContent>
                      <button
                        type="button"
                        className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <ImagePreview
                            src={invoice.companyLogoUrl}
                            alt={
                              invoice.companyName?.trim() || t('unknownCompany')
                            }
                            mode="view"
                            className={itemListThumbClassName}
                          />
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
                              {invoice.invoiceNumber} ·{' '}
                              {t('refLabel', { ref: invoice.paymentReference })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                            </p>
                            <p className="text-sm">
                              {formatLkr(invoice.amountMinor)} ·{' '}
                              {t('dueLabel', { date: formatDate(invoice.dueAt) })}
                            </p>
                          </div>
                        </div>
                      </button>
                    </ItemListContent>
                    <ItemListMenu
                      ariaLabel={t('actionsFor', {
                        name: invoice.companyName || invoice.invoiceNumber,
                      })}
                    >
                      <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                        {tc('view')}
                      </DropdownMenuItem>
                      {role === 'super_admin' &&
                      (invoice.status === 'issued' ||
                        invoice.status === 'overdue' ||
                        invoice.status === 'pending_verification') ? (
                        <DropdownMenuItem onClick={() => void markPaid(invoice)}>
                          {t('markPaid')}
                        </DropdownMenuItem>
                      ) : null}
                      {role === 'super_admin' && invoice.status === 'pending_verification' ? (
                        <DropdownMenuItem onClick={() => void rejectProof(invoice)}>
                          {t('rejectProof')}
                        </DropdownMenuItem>
                      ) : null}
                      {role === 'super_admin' &&
                      invoice.status !== 'paid' &&
                      invoice.status !== 'void' ? (
                        <DropdownMenuItem onClick={() => void voidInvoice(invoice)}>
                          {t('voidAction')}
                        </DropdownMenuItem>
                      ) : null}
                    </ItemListMenu>
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </div>
          <ListPageFooter
            className="mt-auto"
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[12, 24, 48]}
            loadedCount={items.length}
            hasMore={items.length < total}
            loadingMore={listStatus === 'loading' && items.length > 0}
            onPageChange={(next) => reload(next)}
            onPageSizeChange={(nextPageSize) =>
              dispatch(
                invoicesActions.loadListRequested({
                  page: 1,
                  pageSize: nextPageSize,
                  status: appliedFilters.status,
                  extra: { q: appliedFilters.q.trim() || undefined },
                  force: true,
                }),
              )
            }
            onLoadMore={() =>
              dispatch(
                invoicesActions.loadListRequested({
                  page: page + 1,
                  pageSize,
                  status: appliedFilters.status,
                  extra: { q: appliedFilters.q.trim() || undefined },
                  append: true,
                }),
              )
            }
            onModeChange={() => reload(1)}
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

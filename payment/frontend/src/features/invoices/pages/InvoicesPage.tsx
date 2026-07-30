import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  DropdownMenuItem,
  FeaturePage,
  FormField,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  Pagination,
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
import { ConfirmPaymentByReferencePanel } from '@/features/invoices/components/ConfirmPaymentByReferencePanel'
import { invoicesActions } from '@/features/invoices/store'
import { paymentApi } from '@/shared/services/paymentApi'
import type { InvoiceListItem, InvoiceStatus } from '@/shared/types/payment.types'
import { formatDate, formatLkr, formatPeriod } from '@/shared/utils/money'

function statusVariant(status: InvoiceStatus): 'pending' | 'approved' | 'rejected' {
  if (status === 'paid') return 'approved'
  if (status === 'overdue' || status === 'void') return 'rejected'
  return 'pending'
}

function statusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'issued':
      return 'Issued'
    case 'paid':
      return 'Paid'
    case 'overdue':
      return 'Overdue'
    case 'void':
      return 'Void'
    case 'pending_verification':
      return 'Pending review'
    default:
      return status
  }
}

export function InvoicesPage() {
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
  usePlatformLoading(loading ? 'Loading invoices…' : null)

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
      toast({ title: 'Invoice marked paid' })
      reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark paid'
      setActionError(message)
      toast({ title: 'Failed to mark paid', description: message, variant: 'destructive' })
    }
  }

  async function rejectProof(invoice: InvoiceListItem) {
    setActionError(null)
    try {
      await paymentApi.rejectPaymentProof(invoice.id)
      toast({ title: 'Payment proof rejected' })
      reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject proof'
      setActionError(message)
      toast({ title: 'Failed to reject proof', description: message, variant: 'destructive' })
    }
  }

  async function voidInvoice(invoice: InvoiceListItem) {
    setActionError(null)
    try {
      await paymentApi.voidInvoice(invoice.id)
      toast({ title: 'Invoice voided' })
      reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to void invoice'
      setActionError(message)
      toast({ title: 'Failed to void invoice', description: message, variant: 'destructive' })
    }
  }

  const rows = Array.isArray(items) ? items : []
  const isCompanyAdmin = role === 'company_admin'

  return (
    <FeaturePage
      title="Invoices"
      description={
        isCompanyAdmin
          ? 'Your company system subscription invoices'
          : 'System subscription invoices for all companies'
      }
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={isCompanyAdmin ? 'Invoice # or reference' : 'Company, invoice #, or reference'}
            onClear={() => handleSearchChange('')}
            aria-label="Search invoices"
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
        <FormField label="Status" htmlFor="invoice-status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="invoice-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="pending_verification">Pending review</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      {(listError || actionError) && (
        <Alert variant="destructive">
          <AlertDescription>{listError ?? actionError}</AlertDescription>
        </Alert>
      )}

      {role === 'super_admin' ? (
        <ConfirmPaymentByReferencePanel onConfirmed={() => reload()} />
      ) : null}

      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            {rows.length === 0 ? (
              <ItemListEmpty>No system invoices yet.</ItemListEmpty>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {invoice.companyName?.trim() || 'Unknown company'}
                          </p>
                          <StatusTag variant={statusVariant(invoice.status)}>
                            {statusLabel(invoice.status)}
                          </StatusTag>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {invoice.invoiceNumber} · Ref {invoice.paymentReference}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                        </p>
                        <p className="mt-1 text-sm">
                          {formatLkr(invoice.amountMinor)} · Due {formatDate(invoice.dueAt)}
                        </p>
                      </button>
                    </ItemListContent>
                    <ItemListMenu
                      ariaLabel={`Actions for ${invoice.companyName || invoice.invoiceNumber}`}
                    >
                      <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                        View
                      </DropdownMenuItem>
                      {role === 'super_admin' &&
                      (invoice.status === 'issued' ||
                        invoice.status === 'overdue' ||
                        invoice.status === 'pending_verification') ? (
                        <DropdownMenuItem onClick={() => void markPaid(invoice)}>
                          Mark paid
                        </DropdownMenuItem>
                      ) : null}
                      {role === 'super_admin' && invoice.status === 'pending_verification' ? (
                        <DropdownMenuItem onClick={() => void rejectProof(invoice)}>
                          Reject proof
                        </DropdownMenuItem>
                      ) : null}
                      {role === 'super_admin' &&
                      invoice.status !== 'paid' &&
                      invoice.status !== 'void' ? (
                        <DropdownMenuItem onClick={() => void voidInvoice(invoice)}>
                          Void
                        </DropdownMenuItem>
                      ) : null}
                    </ItemListMenu>
                  </ItemListItem>
                ))}
              </ItemList>
            )}
          </div>
          <Pagination
            className="mt-auto"
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[12, 24, 48]}
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
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

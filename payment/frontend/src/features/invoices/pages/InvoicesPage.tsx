import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ItemListViewToggle,
  ListFilterTrigger,
  ListPageActions,
  ListPageBody,
  ListPageFooter,
  SearchInput,
  useToast,
} from '@webonone/ui-kit'
import { useListDisplayModeControl } from '@/shared/hooks/useListDisplayModeControl'
import { InvoicesList } from '@/features/invoices/components/InvoicesList'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { InvoiceStatusFilterFields } from '@/features/invoices/components/InvoiceStatusFilterFields'
import type { InvoiceStatusFilterDraft } from '@/features/invoices/pages/InvoicesFilterEmbedPage'
import { invoicesActions } from '@/features/invoices/store'
import { paymentApi } from '@/shared/services/paymentApi'
import type { InvoiceListItem } from '@/shared/types/payment.types'
export function InvoicesPage() {
  const { t } = useTranslation('invoices')
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
  const { mode: listDisplayMode, setMode: setListDisplayMode } = useListDisplayModeControl()
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
        <ListPageActions>
          <SearchInput
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={isCompanyAdmin ? t('searchPlaceholderCompany') : t('searchPlaceholderAdmin')}
            onClear={() => handleSearchChange('')}
            aria-label={t('search')}
            className="w-64"
          />
          <ListFilterTrigger active={hasActiveFilters || filterOpen} onClick={() => setFilterOpen(true)} />
          <ItemListViewToggle value={listDisplayMode} onChange={setListDisplayMode} />
        </ListPageActions>
      }
    >
      <PlatformHostedListFilterPanel<InvoiceStatusFilterDraft>
        path="/embed/panels/invoices/filters"
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={{ status }}
        onDraftApply={(draft) => setStatus(draft.status)}
        onApply={(draft) => {
          const nextStatus = draft?.status ?? status
          setStatus(nextStatus)
          setAppliedFilters((prev) => ({ ...prev, status: nextStatus }))
          setFilterOpen(false)
        }}
        onClear={() => {
          setStatus('all')
          setAppliedFilters((prev) => ({ ...prev, status: 'all' }))
          setFilterOpen(false)
        }}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <InvoiceStatusFilterFields value={status} onChange={setStatus} />
      </PlatformHostedListFilterPanel>

      {(listError || actionError) && (
        <Alert variant="destructive">
          <AlertDescription>{listError ?? actionError}</AlertDescription>
        </Alert>
      )}

      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            <InvoicesList
              rows={rows}
              role={role}
              onOpen={(id) => navigate(`/invoices/${id}`)}
              onMarkPaid={(invoice) => void markPaid(invoice)}
              onRejectProof={(invoice) => void rejectProof(invoice)}
              onVoid={(invoice) => void voidInvoice(invoice)}
            />
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

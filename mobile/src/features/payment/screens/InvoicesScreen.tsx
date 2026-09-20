import { useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useSession } from '@/features/auth/SessionContext'
import { InvoiceStatusFilterFields } from '@/features/payment/components/InvoiceStatusFilterFields'
import { InvoicesList } from '@/features/payment/components/InvoicesList'
import { paymentApi } from '@/features/payment/services/paymentApi'
import type { InvoiceListItem } from '@/features/payment/types/payment.types'
import { invoiceDetailPath } from '@/features/payment/utils/invoicePaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

export function InvoicesScreen() {
  const { t } = useTranslation('invoices')
  const router = useRouter()
  const { user } = useSession()
  const { toast } = useToast()
  const isSuperAdmin = user?.role === 'super_admin'
  const isCompanyAdmin = user?.role === 'company_admin'

  const [statusDraft, setStatusDraft] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const list = useServerPaginatedList<InvoiceListItem>({
    fetchPage: async (query) => {
      const result = await paymentApi.getInvoices({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        status: String(query.status ?? 'all'),
        q: query.q as string | undefined,
      })
      return {
        items: result.items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      }
    },
  })

  const status = String(list.queryParams.status ?? 'all')
  const hasActiveFilters = status !== 'all'
  const onScroll = useListPageScroll(list)
  const emptyMessage = t('empty')

  async function handleMarkPaid(invoice: InvoiceListItem) {
    try {
      await paymentApi.markPaid(invoice.id)
      toast({ title: t('markedPaid') })
      list.reload()
    } catch (err) {
      toast({
        title: t('failedMarkPaid'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleRejectProof(invoice: InvoiceListItem) {
    try {
      await paymentApi.rejectPaymentProof(invoice.id)
      toast({ title: t('proofRejected') })
      list.reload()
    } catch (err) {
      toast({
        title: t('failedRejectProof'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleVoid(invoice: InvoiceListItem) {
    try {
      await paymentApi.voidInvoice(invoice.id)
      toast({ title: t('voided') })
      list.reload()
    } catch (err) {
      toast({
        title: t('failedVoid'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <FeatureScreen
      title={t('title')}
      description={isCompanyAdmin ? t('descriptionCompany') : t('descriptionAdmin')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            placeholder={isCompanyAdmin ? t('searchPlaceholderCompany') : t('searchPlaceholderAdmin')}
            accessibilityLabel={t('search')}
          />
          <ListFilterTrigger
            active={hasActiveFilters || filterOpen}
            onPress={() => {
              setStatusDraft(status)
              setFilterOpen(true)
            }}
            accessibilityLabel="Filter invoices"
          />
        </ListPageActions>
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={() => list.patchQueryParams({ status: statusDraft })}
        onClear={() => {
          setStatusDraft('all')
          list.patchQueryParams({ status: 'all' })
        }}
      >
        <InvoiceStatusFilterFields value={statusDraft} onChange={setStatusDraft} />
      </ListFilterPanel>

      {list.loading ? <Spinner label={t('loading')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <InvoicesList
            items={list.items}
            emptyMessage={emptyMessage}
            isSuperAdmin={isSuperAdmin}
            onOpen={(invoiceId) => router.push(invoiceDetailPath(invoiceId) as Href)}
            onMarkPaid={(invoice) => void handleMarkPaid(invoice)}
            onRejectProof={(invoice) => void handleRejectProof(invoice)}
            onVoid={(invoice) => void handleVoid(invoice)}
          />
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}
    </FeatureScreen>
  )
}

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  DatePicker,
  FeaturePage,
  FormField,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  ListSearchField,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LoadingState,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { PlatformHandoffSpinner, usePlatformHandoffPending } from '@/features/auth/components/PlatformHandoffSpinner'
import { emailApi } from '@/shared/services/emailApi'
import type { HistoryItem } from '@/shared/types/email.types'
import { HistoryList } from '../components/HistoryList'

function startOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString()
}

function endOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString()
}

export function HistoryPage() {
  const handoffPending = usePlatformHandoffPending()
  const { accessToken } = useAppSelector((s) => s.auth)
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const [items, setItems] = useState<HistoryItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [status, setStatus] = useState<string>('all')
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const hasActiveFilters = status !== 'all' || from !== undefined || to !== undefined

  async function loadHistory(nextPage = page, nextPageSize = pageSize) {
    setLoading(true)
    setError(null)
    try {
      const fromIso = from ? startOfDayIso(from) : undefined
      const toIso = to ? endOfDayIso(to) : undefined
      const data = await emailApi.getHistory({
        page: nextPage,
        pageSize: nextPageSize,
        status: status === 'all' ? undefined : status,
        from: fromIso,
        to: toIso,
        search: searchQuery.trim() || undefined,
      })
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!accessToken) {
      return
    }
    const timer = window.setTimeout(() => {
      void loadHistory(1)
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when search/filters change
  }, [status, searchQuery, accessToken])

  if (handoffPending) {
    return <PlatformHandoffSpinner />
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function handleApplyFilters() {
    setPage(1)
    void loadHistory(1, pageSize)
  }

  function handleClearFilters() {
    setStatus('all')
    setFrom(undefined)
    setTo(undefined)
    setPage(1)
    void loadHistory(1, pageSize)
  }

  function handleClearSearch() {
    setSearchQuery('')
    setPage(1)
    void loadHistory(1, pageSize)
  }

  function handlePageChange(nextPage: number) {
    void loadHistory(nextPage, pageSize)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    void loadHistory(1, nextPageSize)
  }

  return (
    <FeaturePage
      title="Send history"
      description={
        userRole === 'company_admin'
          ? 'Company-scoped send history. Platform system emails (such as password reset OTP) are not listed here.'
          : 'Audit trail of sent and failed messages for your scope.'
      }
      actions={
        <div className="flex items-center gap-2">
          <ListSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Email or template name"
            onClear={handleClearSearch}
            aria-label="Search by recipient email or template name"
          />
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
        </div>
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      >
        <FormField label="Status" htmlFor="history-status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="history-status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="From date" htmlFor="history-from">
          <DatePicker
            id="history-from"
            withIcon
            value={from}
            onChange={setFrom}
            placeholder="Start date"
          />
        </FormField>

        <FormField label="To date" htmlFor="history-to">
          <DatePicker
            id="history-to"
            withIcon
            value={to}
            onChange={setTo}
            placeholder="End date"
          />
        </FormField>
      </ListFilterPanel>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <LoadingState overlay label="Loading history…" /> : null}

      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            <HistoryList items={items} />
          </div>
          <Pagination
            className="mt-auto"
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

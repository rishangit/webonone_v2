import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
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
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { historyActions } from '@/features/history/store'
import { HistoryList } from '../components/HistoryList'

export function HistoryPage() {
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const { items, total, page, pageSize, listStatus, listError } = useAppSelector((s) => s.history)

  const [status, setStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    search: '',
  })

  const loading = listStatus === 'loading' && items.length === 0
  usePlatformLoading(loading ? 'Loading history…' : null)

  const hasActiveFilters = appliedFilters.status !== 'all'

  useEffect(() => {
    if (!accessToken) return
    const timer = window.setTimeout(() => {
      dispatch(
        historyActions.loadListRequested({
          page: 1,
          pageSize,
          status: appliedFilters.status,
          extra: {
            search: appliedFilters.search.trim() || undefined,
          },
        }),
      )
    }, 400)
    return () => window.clearTimeout(timer)
  }, [accessToken, appliedFilters, dispatch, pageSize])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function dispatchLoad(nextPage: number, nextPageSize: number, filters = appliedFilters) {
    dispatch(
      historyActions.loadListRequested({
        page: nextPage,
        pageSize: nextPageSize,
        status: filters.status,
        extra: {
          search: filters.search.trim() || undefined,
        },
      }),
    )
  }

  function handleApplyFilters() {
    const next = { status, search: searchQuery }
    setAppliedFilters(next)
    dispatchLoad(1, pageSize, next)
  }

  function handleClearFilters() {
    setStatus('all')
    const next = { status: 'all', search: searchQuery }
    setAppliedFilters(next)
    dispatchLoad(1, pageSize, next)
  }

  function handleClearSearch() {
    setSearchQuery('')
    const next = { ...appliedFilters, search: '' }
    setAppliedFilters(next)
    dispatchLoad(1, pageSize, next)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    const next = { ...appliedFilters, search: value }
    setAppliedFilters(next)
  }

  return (
    <FeaturePage
      title="Send history"
      description={
        userRole === 'company_admin'
          ? 'Company-scoped send history. Platform system messages (such as OTP) are not listed here.'
          : 'Audit trail of sent and failed messages for your scope.'
      }
      actions={
        <div className="flex items-center gap-2">
          <ListSearchField
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Phone number or template"
            onClear={handleClearSearch}
            aria-label="Search by recipient number or template name"
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
      </ListFilterPanel>

      {listError ? (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}
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
            onPageChange={(nextPage) => dispatchLoad(nextPage, pageSize)}
            onPageSizeChange={(nextPageSize) => dispatchLoad(1, nextPageSize)}
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

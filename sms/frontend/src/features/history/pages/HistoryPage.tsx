import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  FormField,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  SearchInput,
  ListPageFooter,
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
  const { t } = useTranslation('shell')
  const { t: tc } = useTranslation('common')
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
  usePlatformLoading(loading ? t('loadingHistory') : null)

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

  function dispatchLoad(nextPage: number, nextPageSize: number, filters = appliedFilters, append = false) {
    dispatch(
      historyActions.loadListRequested({
        page: nextPage,
        pageSize: nextPageSize,
        status: filters.status,
        append,
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
      title={t('historyTitle')}
      description={
        userRole === 'company_admin' ? t('historyDescriptionCompany') : t('historyDescription')
      }
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t('historySearchPlaceholder')}
            onClear={handleClearSearch}
            aria-label={t('historySearchAria')}
            className="w-64"
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
        <FormField label={tc('status')} htmlFor="history-status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="history-status">
              <SelectValue placeholder={t('allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('all')}</SelectItem>
              <SelectItem value="sent">{t('statusSent')}</SelectItem>
              <SelectItem value="failed">{t('statusFailed')}</SelectItem>
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
          <ListPageFooter
            className="mt-auto"
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[12, 24, 48]}
            loadedCount={items.length}
            hasMore={items.length < total}
            loadingMore={listStatus === 'loading' && items.length > 0}
            onPageChange={(nextPage) => dispatchLoad(nextPage, pageSize)}
            onPageSizeChange={(nextPageSize) => dispatchLoad(1, nextPageSize)}
            onLoadMore={() => dispatchLoad(page + 1, pageSize, appliedFilters, true)}
            onModeChange={() => dispatchLoad(1, pageSize)}
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

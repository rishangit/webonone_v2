import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListFilterTrigger,
  ListPageBody,
  SearchInput,
  ListPageFooter,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { historyActions } from '@/features/history/store'
import { EmailDeliveryStatusDateFilterFields } from '@/shared/components/EmailDeliveryStatusDateFilterFields'
import type { EmailDeliveryStatusDateFilterDraft } from '@/shared/types/filterDrafts'
import { parseFilterDate, serializeFilterDate } from '@/shared/types/filterDrafts'
import { HistoryList } from '../components/HistoryList'

function startOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString()
}

function endOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString()
}

export function HistoryPage() {
  const { t } = useTranslation('shell')
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const { items, total, page, pageSize, listStatus, listError } = useAppSelector((s) => s.history)

  const [status, setStatus] = useState<string>('all')
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
    search: '',
  })

  const loading = listStatus === 'loading' && items.length === 0
  usePlatformLoading(loading ? t('loadingHistory') : null)

  const hasActiveFilters =
    appliedFilters.status !== 'all' ||
    appliedFilters.from !== undefined ||
    appliedFilters.to !== undefined

  useEffect(() => {
    if (!accessToken) return
    const timer = window.setTimeout(() => {
      dispatch(
        historyActions.loadListRequested({
          page: 1,
          pageSize,
          status: appliedFilters.status,
          extra: {
            from: appliedFilters.from ? startOfDayIso(appliedFilters.from) : undefined,
            to: appliedFilters.to ? endOfDayIso(appliedFilters.to) : undefined,
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
          from: filters.from ? startOfDayIso(filters.from) : undefined,
          to: filters.to ? endOfDayIso(filters.to) : undefined,
          search: filters.search.trim() || undefined,
        },
      }),
    )
  }

  function applyFilters(draft?: EmailDeliveryStatusDateFilterDraft) {
    const nextStatus = draft?.status ?? status
    const nextFrom = draft ? parseFilterDate(draft.from) : from
    const nextTo = draft ? parseFilterDate(draft.to) : to
    const next = { status: nextStatus, from: nextFrom, to: nextTo, search: searchQuery }
    setStatus(nextStatus)
    setFrom(nextFrom)
    setTo(nextTo)
    setAppliedFilters(next)
    dispatchLoad(1, pageSize, next)
  }

  function handleApplyFilters(draft?: EmailDeliveryStatusDateFilterDraft) {
    applyFilters(draft)
  }

  function handleClearFilters() {
    setStatus('all')
    setFrom(undefined)
    setTo(undefined)
    const next = { status: 'all', from: undefined, to: undefined, search: searchQuery }
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
      <PlatformHostedListFilterPanel<EmailDeliveryStatusDateFilterDraft>
        path="/embed/panels/history/filters"
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={{
          status,
          from: serializeFilterDate(from),
          to: serializeFilterDate(to),
        }}
        onDraftApply={(draft) => {
          setStatus(draft.status)
          setFrom(parseFilterDate(draft.from))
          setTo(parseFilterDate(draft.to))
        }}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <EmailDeliveryStatusDateFilterFields
          idPrefix="history"
          status={status}
          onStatusChange={setStatus}
          from={from}
          onFromChange={setFrom}
          to={to}
          onToChange={setTo}
        />
      </PlatformHostedListFilterPanel>

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

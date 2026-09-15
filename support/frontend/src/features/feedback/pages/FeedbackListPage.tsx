import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  FormField,
  ListAddButton,
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
  Spinner,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isSessionSuperAdmin } from '@/features/auth/utils/currentRole'
import { FeedbackFormDialog } from '@/features/feedback/components/FeedbackFormDialog'
import { FeedbackList } from '@/features/feedback/components/FeedbackList'
import type { FeedbackStatus, FeedbackType } from '@/features/feedback/schemas/feedbackSchemas'
import { feedbackActions } from '@/features/feedback/store/feedbackSlice'

export function FeedbackListPage() {
  const { t } = useTranslation('feedback')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const {
    items,
    total,
    page,
    pageSize,
    hasMore,
    listStatus,
    listError,
    loadingMore,
    createStatus,
    createError,
    updatingId,
    updateError,
  } = useAppSelector((s) => s.feedback)

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all')
  const [appliedFilters, setAppliedFilters] = useState({
    type: 'all' as 'all' | FeedbackType,
    status: 'all' as 'all' | FeedbackStatus,
  })
  const [createOpen, setCreateOpen] = useState(false)

  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const loading = listStatus === 'loading' && items.length === 0

  const hasActiveFilters = appliedFilters.type !== 'all' || appliedFilters.status !== 'all'

  useEffect(() => {
    if (!accessToken) return
    const timer = window.setTimeout(() => {
      dispatch(
        feedbackActions.loadListRequested({
          page: 1,
          pageSize,
          type: appliedFilters.type === 'all' ? undefined : appliedFilters.type,
          status: appliedFilters.status === 'all' ? undefined : appliedFilters.status,
          q: appliedSearch.trim() || undefined,
        }),
      )
    }, 400)
    return () => window.clearTimeout(timer)
  }, [accessToken, appliedFilters, appliedSearch, dispatch, pageSize])

  useEffect(() => {
    if (createStatus === 'succeeded') {
      setCreateOpen(false)
      dispatch(feedbackActions.resetCreateStatus())
      toast({ title: t('createSuccess') })
    }
  }, [createStatus, dispatch, t, toast])

  useEffect(() => {
    if (updateError) {
      toast({ title: t('updateFailed'), description: updateError, variant: 'destructive' })
    }
  }, [t, toast, updateError])

  function dispatchLoad(nextPage: number, nextPageSize: number, append = false) {
    dispatch(
      feedbackActions.loadListRequested({
        page: nextPage,
        pageSize: nextPageSize,
        type: appliedFilters.type === 'all' ? undefined : appliedFilters.type,
        status: appliedFilters.status === 'all' ? undefined : appliedFilters.status,
        q: appliedSearch.trim() || undefined,
        append,
      }),
    )
  }

  function handleSearchSubmit() {
    setAppliedSearch(searchQuery)
  }

  function handleApplyFilters() {
    const next = { type: typeFilter, status: statusFilter }
    setAppliedFilters(next)
    dispatchLoad(1, pageSize)
  }

  function handleClearFilters() {
    setTypeFilter('all')
    setStatusFilter('all')
    setAppliedFilters({ type: 'all', status: 'all' })
    dispatchLoad(1, pageSize)
  }

  function handleStatusChange(id: string, status: FeedbackStatus) {
    dispatch(feedbackActions.updateStatusRequested({ id, status }))
  }

  return (
    <FeaturePage
      title={t('pageTitle')}
      description={t('pageDescription')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onClear={() => {
              setSearchQuery('')
              setAppliedSearch('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSearchSubmit()
              }
            }}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
            className="w-64"
          />
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          <ListAddButton onClick={() => setCreateOpen(true)}>{t('addReport')}</ListAddButton>
        </div>
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      >
        <FormField htmlFor="feedback-filter-type" label={t('filterType')}>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as 'all' | FeedbackType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filterAll')}</SelectItem>
              <SelectItem value="bug">{t('type.bug')}</SelectItem>
              <SelectItem value="feature">{t('type.feature')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField htmlFor="feedback-filter-status" label={t('filterStatus')}>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'all' | FeedbackStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filterAll')}</SelectItem>
              <SelectItem value="todo">{t('status.todo')}</SelectItem>
              <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
              <SelectItem value="completed">{t('status.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      <ListPageBody>
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {listError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex-1">
              <FeedbackList
                items={items}
                isSuperAdmin={isSuperAdmin}
                updatingId={updatingId}
                onStatusChange={handleStatusChange}
              />
            </div>
            <ListPageFooter
              className="mt-auto"
              totalCount={total}
              currentPage={page}
              pageSize={pageSize}
              pageSizeOptions={[12, 24, 48]}
              loadedCount={items.length}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onPageChange={(nextPage) => dispatchLoad(nextPage, pageSize)}
              onPageSizeChange={(size) => dispatchLoad(1, size)}
              onLoadMore={() => dispatchLoad(page + 1, pageSize, true)}
            />
          </>
        )}
      </ListPageBody>

      <FeedbackFormDialog
        open={createOpen}
        isSaving={createStatus === 'loading'}
        error={createError}
        onOpenChange={setCreateOpen}
        onSubmit={(values) => dispatch(feedbackActions.createRequested(values))}
      />
    </FeaturePage>
  )
}

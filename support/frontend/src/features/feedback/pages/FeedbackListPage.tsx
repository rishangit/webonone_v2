import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  FormField,
  ItemListViewToggle,
  ListAddButton,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageActions,
  ListPageBody,
  ListPageFooter,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  tabsPageClassName,
  useToast,
} from '@webonone/ui-kit'
import { useListDisplayModeControl } from '@/shared/hooks/useListDisplayModeControl'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isSessionSuperAdmin } from '@/features/auth/utils/currentRole'
import { FeedbackFormDialog } from '@/features/feedback/components/FeedbackFormDialog'
import { FeedbackList } from '@/features/feedback/components/FeedbackList'
import { useVisibleInterval } from '@/features/feedback/hooks/useVisibleInterval'
import {
  FEEDBACK_STATUS_ORDER,
  type FeedbackStatus,
  type FeedbackType,
} from '@/features/feedback/schemas/feedbackSchemas'
import { feedbackActions } from '@/features/feedback/store/feedbackSlice'

const LIST_POLL_MS = 15_000

type StatusTab = 'all' | FeedbackStatus

export function FeedbackListPage() {
  const { t } = useTranslation('feedback')
  const navigate = useNavigate()
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
    editStatus,
  } = useAppSelector((s) => s.feedback)

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all')
  const [appliedTypeFilter, setAppliedTypeFilter] = useState<'all' | FeedbackType>('all')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const loading = listStatus === 'loading' && items.length === 0
  const { mode: listDisplayMode, setMode: setListDisplayMode } = useListDisplayModeControl()

  const hasActiveFilters = appliedTypeFilter !== 'all'

  function dispatchLoad(nextPage: number, nextPageSize: number, append = false) {
    dispatch(
      feedbackActions.loadListRequested({
        page: nextPage,
        pageSize: nextPageSize,
        type: appliedTypeFilter === 'all' ? undefined : appliedTypeFilter,
        status: statusTab === 'all' ? undefined : statusTab,
        q: appliedSearch.trim() || undefined,
        append,
      }),
    )
  }

  useEffect(() => {
    if (!accessToken) return
    const timer = window.setTimeout(() => {
      dispatchLoad(1, pageSize)
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters/search/token change
  }, [accessToken, appliedTypeFilter, statusTab, appliedSearch, dispatch, pageSize])

  useVisibleInterval(
    () => {
      dispatchLoad(page, pageSize)
    },
    LIST_POLL_MS,
    Boolean(accessToken),
  )

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

  useEffect(() => {
    if (editStatus === 'succeeded') {
      toast({ title: t('editSuccess') })
      dispatch(feedbackActions.resetEditStatus())
    }
  }, [dispatch, editStatus, t, toast])

  function handleSearchSubmit() {
    setAppliedSearch(searchQuery)
  }

  function handleApplyFilters() {
    setAppliedTypeFilter(typeFilter)
    dispatch(
      feedbackActions.loadListRequested({
        page: 1,
        pageSize,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusTab === 'all' ? undefined : statusTab,
        q: appliedSearch.trim() || undefined,
      }),
    )
  }

  function handleClearFilters() {
    setTypeFilter('all')
    setAppliedTypeFilter('all')
    dispatch(
      feedbackActions.loadListRequested({
        page: 1,
        pageSize,
        status: statusTab === 'all' ? undefined : statusTab,
        q: appliedSearch.trim() || undefined,
      }),
    )
  }

  function handleStatusTabChange(value: string) {
    setStatusTab(value as StatusTab)
  }

  function handleStatusChange(id: string, status: FeedbackStatus) {
    dispatch(feedbackActions.updateStatusRequested({ id, status }))
  }

  return (
    <FeaturePage
      title={t('pageTitle')}
      description={t('pageDescription')}
      actions={
        <ListPageActions>
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
          <ItemListViewToggle value={listDisplayMode} onChange={setListDisplayMode} />
          <ListAddButton onClick={() => setCreateOpen(true)}>{t('addReport')}</ListAddButton>
        </ListPageActions>
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
      </ListFilterPanel>

      <div className={tabsPageClassName}>
        <Tabs value={statusTab} onValueChange={handleStatusTabChange}>
          <TabsList aria-label={t('statusTabsAria')}>
            <TabsTrigger value="all">{t('filterAll')}</TabsTrigger>
            {FEEDBACK_STATUS_ORDER.map((status) => (
              <TabsTrigger key={status} value={status}>
                {t(`status.${status}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

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
                onOpenDetail={(item) => navigate(`/feedback/${item.ticketNumber}`)}
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
        accessToken={accessToken}
        onOpenChange={setCreateOpen}
        onSubmit={(values) => dispatch(feedbackActions.createRequested(values))}
      />
    </FeaturePage>
  )
}

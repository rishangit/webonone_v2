import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ItemListViewToggle,
  ListFilterTrigger,
  ListPageActions,
  ListPageBody,
  ListPageFooter,
  useListPageMode,
} from '@webonone/ui-kit'
import { useListDisplayModeControl } from '@/shared/hooks/useListDisplayModeControl'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { QueueStatusFilterFields } from '@/features/queue/components/QueueStatusFilterFields'
import { queueActions } from '@/features/queue/store'
import type { EmailQueueStatusFilterDraft } from '@/shared/types/filterDrafts'
import type { QueueItem, QueueStatus } from '@/shared/types/email.types'
import { QueueList } from '../components/QueueList'

const POLL_MS = 30_000

export function QueuePage() {
  const { t } = useTranslation('queue')

  const dispatch = useAppDispatch()
  const role = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const {
    items,
    total,
    page,
    pageSize,
    status: tab,
    listStatus,
    listError,
    retryingId,
    retryError,
  } = useAppSelector((s) => s.queue)

  const [filterOpen, setFilterOpen] = useState(false)
  const [pendingTab, setPendingTab] = useState<QueueStatus>(tab)

  const loading = listStatus === 'loading' && items.length === 0
  const canRetry = role === 'super_admin'
  const hasActiveFilters = tab !== 'pending'
  const error = listError ?? retryError
  const listPageMode = useListPageMode()
  const { mode: listDisplayMode, setMode: setListDisplayMode } = useListDisplayModeControl()

  usePlatformLoading(loading ? t('loading') : null)

  useEffect(() => {
    dispatch(queueActions.loadListRequested({ status: tab, page: 1, pageSize }))
  }, [dispatch, tab, pageSize])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (listPageMode === 'on-scroll' && items.length > pageSize) {
        dispatch(
          queueActions.loadListRequested({
            status: tab,
            page: 1,
            pageSize: Math.max(items.length, 12),
            force: true,
          }),
        )
        return
      }
      dispatch(queueActions.loadListRequested({ status: tab, page, pageSize, force: true }))
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [dispatch, tab, page, pageSize, listPageMode, items.length])

  function handleRetry(item: QueueItem) {
    dispatch(queueActions.retryRequested({ id: item.id }))
  }

  function handleApplyFilters(draft?: EmailQueueStatusFilterDraft) {
    const nextTab = (draft?.status as QueueStatus | undefined) ?? pendingTab
    setPendingTab(nextTab)
    dispatch(queueActions.loadListRequested({ status: nextTab, page: 1, pageSize }))
  }

  function handleClearFilters() {
    setPendingTab('pending')
    dispatch(queueActions.loadListRequested({ status: 'pending', page: 1, pageSize }))
  }

  function handleRefresh() {
    dispatch(queueActions.loadListRequested({ status: tab, page, pageSize, force: true }))
  }

  return (
    <FeaturePage
      title={t('title')}
      description={t('description')}
      actions={
        <ListPageActions>
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          <ItemListViewToggle value={listDisplayMode} onChange={setListDisplayMode} />
          <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
            {t('refreshNow')}
          </Button>
        </ListPageActions>
      }
    >
      <PlatformHostedListFilterPanel<EmailQueueStatusFilterDraft>
        path="/embed/panels/queue/filters"
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={{ status: pendingTab }}
        onDraftApply={(draft) => setPendingTab(draft.status as QueueStatus)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <QueueStatusFilterFields value={pendingTab} onChange={setPendingTab} />
      </PlatformHostedListFilterPanel>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            <QueueList
              items={items}
              canRetry={canRetry}
              onRetry={handleRetry}
              retryingId={retryingId}
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
            onPageChange={(nextPage) =>
              dispatch(queueActions.loadListRequested({ status: tab, page: nextPage, pageSize }))
            }
            onPageSizeChange={(nextPageSize) => {
              dispatch(
                queueActions.loadListRequested({ status: tab, page: 1, pageSize: nextPageSize }),
              )
            }}
            onLoadMore={() =>
              dispatch(
                queueActions.loadListRequested({
                  status: tab,
                  page: page + 1,
                  pageSize,
                  append: true,
                }),
              )
            }
            onModeChange={() =>
              dispatch(queueActions.loadListRequested({ status: tab, page: 1, pageSize, force: true }))
            }
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

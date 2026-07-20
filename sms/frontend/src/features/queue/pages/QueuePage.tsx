import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { queueActions } from '@/features/queue/store'
import type { QueueItem, QueueStatus } from '@/shared/types/sms.types'
import { QueueList } from '../components/QueueList'

const STATUS_OPTIONS: { key: QueueStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
]

const POLL_MS = 30_000

export function QueuePage() {
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
  const canRetry = role === 'super_admin' || role === 'company_admin'
  const hasActiveFilters = tab !== 'pending'
  const error = listError ?? retryError

  usePlatformLoading(loading ? 'Loading queue…' : null)

  useEffect(() => {
    dispatch(queueActions.loadListRequested({ status: tab, page: 1, pageSize }))
  }, [dispatch, tab, pageSize])

  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch(queueActions.loadListRequested({ status: tab, page, pageSize, force: true }))
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [dispatch, tab, page, pageSize])

  function handleRetry(item: QueueItem) {
    dispatch(queueActions.retryRequested({ id: item.id }))
  }

  function handleApplyFilters() {
    dispatch(queueActions.loadListRequested({ status: pendingTab, page: 1, pageSize }))
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
      title="Queue"
      description="Live queue status. Refreshes every 30 seconds."
      actions={
        <div className="flex items-center gap-2">
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
            Refresh now
          </Button>
        </div>
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      >
        <FormField label="Status" htmlFor="queue-status">
          <Select value={pendingTab} onValueChange={(value) => setPendingTab(value as QueueStatus)}>
            <SelectTrigger id="queue-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

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
          <Pagination
            className="mt-auto"
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={(nextPage) =>
              dispatch(queueActions.loadListRequested({ status: tab, page: nextPage, pageSize }))
            }
            onPageSizeChange={(nextPageSize) => {
              dispatch(
                queueActions.loadListRequested({ status: tab, page: 1, pageSize: nextPageSize }),
              )
            }}
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

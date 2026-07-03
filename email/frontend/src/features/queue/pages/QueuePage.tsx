import { useCallback, useEffect, useState } from 'react'
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
  LoadingState,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { emailApi } from '@/shared/services/emailApi'
import type { QueueItem, QueueStatus } from '@/shared/types/email.types'
import { QueueList } from '../components/QueueList'

const STATUS_OPTIONS: { key: QueueStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
]

const POLL_MS = 30_000

export function QueuePage() {
  const role = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const [tab, setTab] = useState<QueueStatus>('pending')
  const [items, setItems] = useState<QueueItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [filterOpen, setFilterOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const canRetry = role === 'super_admin'
  const hasActiveFilters = tab !== 'pending'

  const loadQueue = useCallback(async (nextPage = page, nextPageSize = pageSize) => {
    setError(null)
    try {
      const data = await emailApi.listQueue({ status: tab, page: nextPage, pageSize: nextPageSize })
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    void loadQueue(1, pageSize)
  }, [tab, pageSize, loadQueue])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadQueue(page, pageSize)
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [loadQueue, page, pageSize])

  async function handleRetry(item: QueueItem) {
    setRetryingId(item.id)
    setError(null)
    try {
      await emailApi.retryQueueItem(item.id)
      await loadQueue(page, pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetryingId(null)
    }
  }

  function handleApplyFilters() {
    setPage(1)
    void loadQueue(1, pageSize)
  }

  function handleClearFilters() {
    setTab('pending')
    setPage(1)
    void loadQueue(1, pageSize)
  }

  return (
    <FeaturePage
      title="Queue"
      description="Live queue status. Refreshes every 30 seconds."
      actions={
        <div className="flex items-center gap-2">
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          <Button type="button" variant="outline" size="sm" onClick={() => void loadQueue(page, pageSize)}>
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
          <Select value={tab} onValueChange={(value) => setTab(value as QueueStatus)}>
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

      {loading ? <LoadingState label="Loading queue…" /> : null}

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
            onPageChange={(nextPage) => void loadQueue(nextPage, pageSize)}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(1)
            }}
          />
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}

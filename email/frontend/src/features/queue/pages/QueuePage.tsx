import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription, Button, FeaturePage, Pagination, Spinner } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { emailApi } from '@/shared/services/emailApi'
import type { QueueItem, QueueStatus } from '@/shared/types/email.types'
import { QueueList } from '../components/QueueList'

const TABS: { key: QueueStatus; label: string }[] = [
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
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const canRetry = role === 'super_admin'

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

  return (
    <FeaturePage
      title="Queue"
      description="Live queue status. Refreshes every 30 seconds."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            type="button"
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => void loadQueue(page, pageSize)}>
          Refresh now
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : null}

      {!loading ? (
        <>
          <QueueList
            items={items}
            canRetry={canRetry}
            onRetry={handleRetry}
            retryingId={retryingId}
          />
          <Pagination
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={(nextPage) => void loadQueue(nextPage, pageSize)}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(1)
            }}
          />
        </>
      ) : null}
    </FeaturePage>
  )
}

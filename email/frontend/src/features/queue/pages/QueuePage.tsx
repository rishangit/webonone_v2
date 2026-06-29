import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription, Button, FeaturePage } from '@webonone/ui-kit'
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const canRetry = role === 'super_admin'

  const loadQueue = useCallback(async () => {
    setError(null)
    try {
      const data = await emailApi.listQueue({ status: tab, page: 1, pageSize: 50 })
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    setLoading(true)
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadQueue()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [loadQueue])

  async function handleRetry(item: QueueItem) {
    setRetryingId(item.id)
    setError(null)
    try {
      await emailApi.retryQueueItem(item.id)
      await loadQueue()
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
        <Button type="button" variant="outline" size="sm" onClick={() => void loadQueue()}>
          Refresh now
        </Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading queue…</p> : null}

      {!loading ? (
        <QueueList
          items={items}
          canRetry={canRetry}
          onRetry={handleRetry}
          retryingId={retryingId}
        />
      ) : null}
    </FeaturePage>
  )
}

import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { emailApi } from '@/shared/services/emailApi'
import type { HistoryItem } from '@/shared/types/email.types'
import { HistoryList } from '../components/HistoryList'

export function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [status, setStatus] = useState<string>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [templateSlug, setTemplateSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadHistory(nextPage = page) {
    setLoading(true)
    setError(null)
    try {
      const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : undefined
      const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : undefined
      const data = await emailApi.getHistory({
        page: nextPage,
        pageSize,
        status: status === 'all' ? undefined : status,
        from: fromIso,
        to: toIso,
        templateSlug: templateSlug || undefined,
      })
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [status])

  function handleApplyFilters(event: React.FormEvent) {
    event.preventDefault()
    void loadHistory(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <FeaturePage
      title="Send history"
      description="Audit trail of sent and failed messages for your scope."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleApplyFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <FormField label="From date" htmlFor="history-from">
          <Input id="history-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>

        <FormField label="To date" htmlFor="history-to">
          <Input id="history-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>

        <FormField label="Template slug" htmlFor="history-slug">
          <Input
            id="history-slug"
            value={templateSlug}
            onChange={(e) => setTemplateSlug(e.target.value)}
            placeholder="password_reset"
          />
        </FormField>

        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit">Apply filters</Button>
        </div>
      </form>

      {loading ? <p className="text-sm text-muted-foreground">Loading history…</p> : null}

      {!loading ? <HistoryList items={items} /> : null}

      {!loading && total > pageSize ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => void loadHistory(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => void loadHistory(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </FeaturePage>
  )
}

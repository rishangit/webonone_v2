import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  DatePicker,
  FeaturePage,
  Form,
  FormField,
  Input,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { emailApi } from '@/shared/services/emailApi'
import type { HistoryItem } from '@/shared/types/email.types'
import { HistoryList } from '../components/HistoryList'

function startOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString()
}

function endOfDayIso(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString()
}

export function HistoryPage() {
  const { accessToken } = useAppSelector((s) => s.auth)
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const [items, setItems] = useState<HistoryItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [status, setStatus] = useState<string>('all')
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()
  const [templateSlug, setTemplateSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadHistory(nextPage = page, nextPageSize = pageSize) {
    setLoading(true)
    setError(null)
    try {
      const fromIso = from ? startOfDayIso(from) : undefined
      const toIso = to ? endOfDayIso(to) : undefined
      const data = await emailApi.getHistory({
        page: nextPage,
        pageSize: nextPageSize,
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
    if (!accessToken) {
      return
    }
    void loadHistory(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [status, accessToken])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function handleApplyFilters(event: React.FormEvent) {
    event.preventDefault()
    void loadHistory(1)
  }

  function handlePageChange(nextPage: number) {
    void loadHistory(nextPage, pageSize)
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize)
    void loadHistory(1, nextPageSize)
  }

  return (
    <FeaturePage
      title="Send history"
      description={
        userRole === 'company_admin'
          ? 'Company-scoped send history. Platform system emails (such as password reset OTP) are not listed here.'
          : 'Audit trail of sent and failed messages for your scope.'
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form
        onSubmit={handleApplyFilters}
        className="grid gap-4 space-y-0 sm:grid-cols-2 xl:grid-cols-5 xl:items-end"
      >
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
          <DatePicker
            id="history-from"
            withIcon
            value={from}
            onChange={setFrom}
            placeholder="Start date"
          />
        </FormField>

        <FormField label="To date" htmlFor="history-to">
          <DatePicker
            id="history-to"
            withIcon
            value={to}
            onChange={setTo}
            placeholder="End date"
          />
        </FormField>

        <FormField label="Template slug" htmlFor="history-slug">
          <Input
            id="history-slug"
            value={templateSlug}
            onChange={(e) => setTemplateSlug(e.target.value)}
            placeholder="password_reset"
          />
        </FormField>

        <Button type="submit" className="w-full sm:col-span-2 xl:col-span-1">
          Apply filters
        </Button>
      </Form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : null}

      {!loading ? (
        <>
          <HistoryList items={items} />
          <Pagination
            totalCount={total}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      ) : null}
    </FeaturePage>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Spinner,
  cn,
} from '@webonone/ui-kit'
import {
  loadStaffHistory,
  resolveSessionTokenId,
  type UserHistoryItem,
} from '@/features/staff/services/staffHistoryApi'

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function historyTitle(item: UserHistoryItem): string {
  if (item.kind === 'form_submission') return item.formName
  return item.title
}

function historySubtitle(item: UserHistoryItem): string {
  if (item.kind === 'form_submission') {
    return [
      item.serviceName ? `Service: ${item.serviceName}` : null,
      `For ${item.subjectDisplayName}`,
    ]
      .filter(Boolean)
      .join(' · ')
  }
  return [item.subtitle, item.status ? `Status: ${item.status}` : null].filter(Boolean).join(' · ')
}

function historyBadge(item: UserHistoryItem): string {
  if (item.kind === 'form_submission') return 'Form'
  return 'Session'
}

type StaffHistoryPanelProps = {
  userId: string
}

export function StaffHistoryPanel({ userId }: StaffHistoryPanelProps) {
  const { staffId } = useParams<{ staffId: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<UserHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadStaffHistory(userId)
      .then((next) => {
        if (!cancelled) setItems(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load history')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  function openHistoryItem(item: UserHistoryItem) {
    if (!staffId) return
    if (item.kind === 'form_submission') {
      navigate(`/staff/${staffId}/history/submissions/${item.id}`)
      return
    }
    if (item.type === 'session_token') {
      const tokenId = resolveSessionTokenId(item)
      if (tokenId) navigate(`/staff/${staffId}/history/tokens/${tokenId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (items.length === 0) {
    return <ItemListEmpty>No company history yet.</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((item) => {
        const when = item.kind === 'form_submission' ? item.createdAt : item.occurredAt
        const clickable =
          item.kind === 'form_submission' ||
          (item.kind === 'company_activity' && item.type === 'session_token')
        return (
          <ItemListItem key={item.id}>
            <ItemListContent>
              {clickable ? (
                <button
                  type="button"
                  className="flex w-full flex-wrap items-start justify-between gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openHistoryItem(item)}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">{historyTitle(item)}</p>
                    <p className="text-xs text-muted-foreground">{historySubtitle(item)}</p>
                    <p className="text-xs text-muted-foreground">{formatWhen(when)}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
                    )}
                  >
                    {historyBadge(item)}
                  </span>
                </button>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">{historyTitle(item)}</p>
                    <p className="text-xs text-muted-foreground">{historySubtitle(item)}</p>
                    <p className="text-xs text-muted-foreground">{formatWhen(when)}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
                    )}
                  >
                    {historyBadge(item)}
                  </span>
                </div>
              )}
            </ItemListContent>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}

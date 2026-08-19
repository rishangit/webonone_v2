import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  loadCustomerHistory,
  resolveSaleId,
  resolveSessionTokenId,
  type UserHistoryItem,
} from '@/features/users/services/userHistoryApi'
import type { IdentityUserDetail } from '@/features/users/types'

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

function historySubtitle(item: UserHistoryItem, t: (k: string, o?: Record<string, string>) => string): string {
  if (item.kind === 'form_submission') {
    return [
      item.serviceName ? t('history.servicePrefix', { name: item.serviceName }) : null,
      t('history.filledBy', { name: item.filledByDisplayName }),
    ]
      .filter(Boolean)
      .join(' · ')
  }
  return [item.subtitle, item.status ? t('history.statusPrefix', { status: item.status }) : null].filter(Boolean).join(' · ')
}

function historyBadge(item: UserHistoryItem, t: (k: string) => string): string {
  if (item.kind === 'form_submission') return t('history.badgeForm')
  if (item.kind === 'company_activity' && item.type === 'sale') return t('history.badgeSale')
  return t('history.badgeSession')
}

type UserHistoryPanelProps = {
  user: IdentityUserDetail
}

export function UserHistoryPanel({ user }: UserHistoryPanelProps) {
  const { t } = useTranslation('users')
  const navigate = useNavigate()
  const [items, setItems] = useState<UserHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadCustomerHistory(user.id)
      .then((next) => {
        if (!cancelled) setItems(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('errors.loadHistoryFailed'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user.id])

  function openHistoryItem(item: UserHistoryItem) {
    if (item.kind === 'form_submission') {
      navigate(`/users/${user.id}/history/submissions/${item.id}`)
      return
    }
    if (item.type === 'session_token') {
      const tokenId = resolveSessionTokenId(item)
      if (tokenId) navigate(`/users/${user.id}/history/tokens/${tokenId}`)
      return
    }
    if (item.type === 'sale') {
      const saleId = resolveSaleId(item)
      if (saleId) navigate(`/users/${user.id}/history/sales/${saleId}`)
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

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <ItemListEmpty>{t('empty.history')}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((item) => {
            const when = item.kind === 'form_submission' ? item.createdAt : item.occurredAt
            const clickable =
              item.kind === 'form_submission' ||
              (item.kind === 'company_activity' &&
                (item.type === 'session_token' || item.type === 'sale'))
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
                        <p className="text-xs text-muted-foreground">{historySubtitle(item, t)}</p>
                        <p className="text-xs text-muted-foreground">{formatWhen(when)}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
                        )}
                      >
                        {historyBadge(item, t)}
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium">{historyTitle(item)}</p>
                        <p className="text-xs text-muted-foreground">{historySubtitle(item, t)}</p>
                        <p className="text-xs text-muted-foreground">{formatWhen(when)}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
                        )}
                      >
                        {historyBadge(item, t)}
                      </span>
                    </div>
                  )}
                </ItemListContent>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </div>
  )
}

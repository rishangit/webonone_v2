import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { QueueItem } from '@/shared/types/sms.types'

interface QueueListProps {
  items: QueueItem[]
  canRetry: boolean
  onRetry: (item: QueueItem) => void
  retryingId: string | null
}

function statusLabel(status: QueueItem['status'], t: (k: string) => string): string {
  if (status === 'pending') return t('pending')
  if (status === 'processing') return t('processing')
  return t('failed')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function QueueList({ items, canRetry, onRetry, retryingId }: QueueListProps) {
  const { t } = useTranslation('queue')
  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ItemListEmpty>{t('emptyTab')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {rows.map((item) => {
        const isRetrying = retryingId === item.id

        return (
          <ItemListItem key={item.id}>
            <ItemListContent>
              <p className="font-medium">{item.toNumber}</p>
              <p className="text-xs text-muted-foreground">
                {item.templateSlug ?? t('freeform')} · {statusLabel(item.status, t)} ·{' '}
                {t('attemptsCount', { count: item.retryCount })} · {formatDate(item.createdAt)}
              </p>
              {item.lastError ? (
                <p className="mt-1 text-xs text-destructive line-clamp-2">{item.lastError}</p>
              ) : null}
            </ItemListContent>
            <ItemListMenu ariaLabel={t('actionsFor', { name: item.toNumber })}>
              <DropdownMenuItem disabled>{statusLabel(item.status, t)}</DropdownMenuItem>
              {canRetry && item.status === 'failed' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRetry(item)} disabled={isRetrying}>
                    {t('retry')}
                  </DropdownMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}

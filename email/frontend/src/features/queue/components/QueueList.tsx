import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ListEmptyState,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { QueueItem } from '@/shared/types/email.types'

interface QueueListProps {
  items: QueueItem[]
  canRetry: boolean
  onRetry: (item: QueueItem) => void
  retryingId: string | null
}

function statusLabel(status: QueueItem['status']): string {
  if (status === 'pending') return 'Pending'
  if (status === 'processing') return 'Processing'
  return 'Failed'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function QueueList({ items, canRetry, onRetry, retryingId }: QueueListProps) {
  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ListEmptyState itemType="queue items" message="No queue items in this tab." />
  }

  return (
    <ItemList>
      {rows.map((item) => {
        const isRetrying = retryingId === item.id

        return (
          <ItemListItem key={item.id}>
            <ItemListContent>
              <p className="font-medium">{item.toEmail}</p>
              <p className="text-xs text-muted-foreground">
                {item.templateSlug} · {statusLabel(item.status)} · Attempts {item.retryCount} ·{' '}
                {formatDate(item.createdAt)}
              </p>
              {item.lastError ? (
                <p className="mt-1 text-xs text-destructive line-clamp-2">{item.lastError}</p>
              ) : null}
            </ItemListContent>
            <ItemListMenu ariaLabel={`Queue actions for ${item.toEmail}`}>
              <DropdownMenuItem disabled>{statusLabel(item.status)}</DropdownMenuItem>
              {canRetry && item.status === 'failed' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRetry(item)} disabled={isRetrying}>
                    Retry
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

import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { HistoryItem } from '@/shared/types/sms.types'

interface HistoryListProps {
  items: HistoryItem[]
}

function statusLabel(status: HistoryItem['status']): string {
  return status === 'sent' ? 'Sent' : 'Failed'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export function HistoryList({ items }: HistoryListProps) {
  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ItemListEmpty>No send history for the selected filters.</ItemListEmpty>
  }

  return (
    <ItemList>
      {rows.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <p className="font-medium">{item.toNumber}</p>
            <p className="text-xs text-muted-foreground">
              {item.templateSlug ?? 'freeform'} · {statusLabel(item.status)} · {formatDate(item.createdAt)}
            </p>
            {item.errorMessage ? (
              <p className="mt-1 text-xs text-destructive line-clamp-2">{item.errorMessage}</p>
            ) : null}
          </ItemListContent>
          <ItemListMenu ariaLabel={`History for ${item.toNumber}`}>
            <DropdownMenuItem disabled>{statusLabel(item.status)}</DropdownMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

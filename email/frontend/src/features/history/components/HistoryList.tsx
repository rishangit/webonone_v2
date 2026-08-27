import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { HistoryItem } from '@/shared/types/email.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

interface HistoryListProps {
  items: HistoryItem[]
}

export function HistoryList({ items }: HistoryListProps) {
  const { t } = useTranslation('shell')
  const rows = Array.isArray(items) ? items : []

  function statusLabel(status: HistoryItem['status']): string {
    if (status === 'sent') return t('statusSent')
    return t('statusFailed')
  }

  if (rows.length === 0) {
    return (
      <ItemListEmpty>{t('historyEmpty')}</ItemListEmpty>
    )
  }

  return (
    <ItemList>
      {rows.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <p className="font-medium">{item.recipient}</p>
            <p className="text-xs text-muted-foreground">
              {item.templateSlug} · {statusLabel(item.status)} ·{' '}
              {item.sentAt ? formatDisplayDateTime(item.sentAt) : '—'}
            </p>
            {item.errorMessage ? (
              <p className="mt-1 text-xs text-destructive line-clamp-2">{item.errorMessage}</p>
            ) : null}
          </ItemListContent>
          <ItemListMenu ariaLabel={t('historyActionsFor', { name: item.recipient })}>
            <DropdownMenuItem disabled>{statusLabel(item.status)}</DropdownMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { HistoryItem } from '@/shared/types/sms.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

interface HistoryListProps {
  items: HistoryItem[]
}

export function HistoryList({ items }: HistoryListProps) {
  const { t } = useTranslation('shell')
  const rows = Array.isArray(items) ? items : []

  function statusLabel(status: HistoryItem['status']): string {
    if (status === 'sent') return t('statusSent')
    if (status === 'skipped') return t('statusSkipped')
    return t('statusFailed')
  }

  if (rows.length === 0) {
    return <ItemListEmpty>{t('historyEmpty')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {rows.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <p className="font-medium">{item.toNumber}</p>
            <p className="text-xs text-muted-foreground">
              {item.templateSlug ?? t('queue:freeform')} · {statusLabel(item.status)} · {item.createdAt ? formatDisplayDateTime(item.createdAt) : '—'}
            </p>
            {item.errorMessage ? (
              <p
                className={`mt-1 text-xs line-clamp-2 ${
                  item.status === 'skipped' ? 'text-muted-foreground' : 'text-destructive'
                }`}
              >
                {item.errorMessage === 'template_inactive'
                  ? t('historySkipTemplateInactive')
                  : item.errorMessage}
              </p>
            ) : null}
          </ItemListContent>
          <ItemListMenu ariaLabel={t('historyActionsFor', { name: item.toNumber })}>
            <DropdownMenuItem disabled>{statusLabel(item.status)}</DropdownMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

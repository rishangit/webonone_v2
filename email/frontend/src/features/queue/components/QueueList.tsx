import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  dateSortColumn,
} from '@webonone/ui-kit'
import type { QueueItem } from '@/shared/types/email.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

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

export function QueueList({ items, canRetry, onRetry, retryingId }: QueueListProps) {
  const { t, i18n } = useTranslation('queue')
  const rows = Array.isArray(items) ? items : []

  const columns = useMemo(
    () => [
      {
        id: 'to',
        header: 'To',
        sortable: true,
        compare: (a: QueueItem, b: QueueItem) =>
          a.toEmail.localeCompare(b.toEmail, undefined, { sensitivity: 'base' }),
        cell: (item: QueueItem) => item.toEmail,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (item: QueueItem) => statusLabel(item.status, t),
      },
      dateSortColumn<QueueItem>(
        'created',
        'Created',
        (item) => item.createdAt,
        (iso) => formatDisplayDateTime(iso, i18n.language),
      ),
    ],
    [i18n.language, t],
  )

  function renderRowMenu(item: QueueItem) {
    const isRetrying = retryingId === item.id
    return (
      <ItemListMenu ariaLabel={t('actionsFor', { name: item.toEmail })}>
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
    )
  }

  function rowBody(item: QueueItem) {
    return (
      <>
        <p className="font-medium">{item.toEmail}</p>
        <p className="text-xs text-muted-foreground">
          {item.templateSlug} · {statusLabel(item.status, t)} ·{' '}
          {t('attemptsCount', { count: item.retryCount })} ·{' '}
          {formatDisplayDateTime(item.createdAt, i18n.language)}
        </p>
        {item.lastError ? (
          <p className="mt-1 line-clamp-2 text-xs text-destructive">{item.lastError}</p>
        ) : null}
      </>
    )
  }

  return (
    <CollectionListView
      items={rows}
      getRowKey={(item) => item.id}
      columns={columns}
      empty={<ItemListEmpty>{t('emptyTab')}</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      renderListItem={(item) => (
        <ItemListItem>
          <ItemListContent>{rowBody(item)}</ItemListContent>
          {renderRowMenu(item)}
        </ItemListItem>
      )}
      renderCard={(item) => (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage />}
          menu={renderRowMenu(item)}
        >
          {rowBody(item)}
        </ItemListCollectionCard>
      )}
    />
  )
}

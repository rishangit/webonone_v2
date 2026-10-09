import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  DropdownMenuItem,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  dateSortColumn,
} from '@webonone/ui-kit'
import type { HistoryItem } from '@/shared/types/sms.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

interface HistoryListProps {
  items: HistoryItem[]
}

export function HistoryList({ items }: HistoryListProps) {
  const { t, i18n } = useTranslation('shell')
  const rows = Array.isArray(items) ? items : []

  function statusLabel(status: HistoryItem['status']): string {
    if (status === 'sent') return t('statusSent')
    if (status === 'skipped') return t('statusSkipped')
    return t('statusFailed')
  }

  const columns = useMemo(
    () => [
      {
        id: 'to',
        header: 'To',
        sortable: true,
        compare: (a: HistoryItem, b: HistoryItem) =>
          a.toNumber.localeCompare(b.toNumber, undefined, { sensitivity: 'base' }),
        cell: (item: HistoryItem) => item.toNumber,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (item: HistoryItem) => statusLabel(item.status),
      },
      dateSortColumn<HistoryItem>(
        'created',
        'Created',
        (item) => item.createdAt,
        (iso) => formatDisplayDateTime(iso, i18n.language),
      ),
    ],
    [i18n.language, t],
  )

  function renderRowMenu(item: HistoryItem) {
    return (
      <ItemListMenu ariaLabel={t('historyActionsFor', { name: item.toNumber })}>
        <DropdownMenuItem disabled>{statusLabel(item.status)}</DropdownMenuItem>
      </ItemListMenu>
    )
  }

  function rowBody(item: HistoryItem) {
    return (
      <>
        <p className="font-medium">{item.toNumber}</p>
        <p className="text-xs text-muted-foreground">
          {item.templateSlug ?? t('queue:freeform')} · {statusLabel(item.status)} ·{' '}
          {item.createdAt ? formatDisplayDateTime(item.createdAt, i18n.language) : '—'}
        </p>
        {item.errorMessage ? (
          <p
            className={`mt-1 line-clamp-2 text-xs ${
              item.status === 'skipped' ? 'text-muted-foreground' : 'text-destructive'
            }`}
          >
            {item.errorMessage === 'template_inactive'
              ? t('historySkipTemplateInactive')
              : item.errorMessage}
          </p>
        ) : null}
      </>
    )
  }

  return (
    <CollectionListView
      items={rows}
      getRowKey={(item) => item.id}
      columns={columns}
      empty={<ItemListEmpty>{t('historyEmpty')}</ItemListEmpty>}
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

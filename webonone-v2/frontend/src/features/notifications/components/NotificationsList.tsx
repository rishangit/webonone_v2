import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  cn,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { notificationsActions } from '../store/notificationsSlice'
import type { NotificationItem } from '../services/notificationsApi'
import { formatNotificationRelative } from '../utils/formatNotificationRelative'

type NotificationsListProps = {
  items: NotificationItem[]
}

export function NotificationsList({ items }: NotificationsListProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('shell')
  const { t: tc } = useTranslation('common')

  function handleOpen(item: NotificationItem) {
    if (!item.readAt) {
      dispatch(notificationsActions.markReadRequested(item.id))
    }
    if (item.href) {
      navigate(item.href)
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'title',
        header: tc('name'),
        sortable: true,
        compare: (a: NotificationItem, b: NotificationItem) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
        cell: (item: NotificationItem) => (
          <button
            type="button"
            className={cn(
              'rounded-md text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !item.readAt ? 'font-semibold' : 'font-medium',
            )}
            onClick={() => handleOpen(item)}
          >
            {item.title}
          </button>
        ),
      },
      {
        id: 'when',
        header: t('notifications.columnWhen'),
        sortable: true,
        compare: (a: NotificationItem, b: NotificationItem) =>
          a.createdAt.localeCompare(b.createdAt),
        cell: (item: NotificationItem) =>
          formatNotificationRelative(item.createdAt, i18n.language),
      },
    ],
    [i18n.language, t, tc],
  )

  function rowBody(item: NotificationItem) {
    return (
      <button
        type="button"
        className={cn(
          'flex w-full flex-col gap-0.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !item.readAt && 'font-semibold',
        )}
        onClick={() => handleOpen(item)}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm text-foreground',
              !item.readAt ? 'font-semibold' : 'font-medium',
            )}
          >
            {item.title}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatNotificationRelative(item.createdAt, i18n.language)}
          </span>
        </div>
        {item.body ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
        ) : null}
      </button>
    )
  }

  return (
    <CollectionListView
      items={items}
      getRowKey={(item) => item.id}
      columns={columns}
      empty={<ItemListEmpty>{t('notifications.empty')}</ItemListEmpty>}
      renderListItem={(item) => (
        <ItemListItem>
          <ItemListContent>{rowBody(item)}</ItemListContent>
        </ItemListItem>
      )}
      renderCard={(item) => (
        <ItemListCollectionCard image={<ItemListCardPlaceholderImage />}>
          {rowBody(item)}
        </ItemListCollectionCard>
      )}
    />
  )
}

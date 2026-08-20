import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ItemList,
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

  if (items.length === 0) {
    return <ItemListEmpty>{t('notifications.empty')}</ItemListEmpty>
  }

  function handleOpen(item: NotificationItem) {
    if (!item.readAt) {
      dispatch(notificationsActions.markReadRequested(item.id))
    }
    if (item.href) {
      navigate(item.href)
    }
  }

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
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
          </ItemListContent>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

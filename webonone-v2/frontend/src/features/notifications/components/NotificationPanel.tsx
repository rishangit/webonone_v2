import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, cn } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { notificationsActions } from '../store/notificationsSlice'
import type { NotificationItem } from '../services/notificationsApi'
import { formatNotificationRelative } from '../utils/formatNotificationRelative'

type NotificationPanelProps = {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('shell')
  const items = useAppSelector((s) => s.notifications.items)
  const status = useAppSelector((s) => s.notifications.status)
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)

  function handleOpen(item: NotificationItem) {
    if (!item.readAt) {
      dispatch(notificationsActions.markReadRequested(item.id))
    }
    onClose()
    if (item.href) {
      navigate(item.href)
    }
  }

  function handleSeeAll() {
    onClose()
    navigate('/notifications')
  }

  return (
    <div className="flex w-[min(100vw-2rem,22rem)] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-sm font-medium text-foreground">{t('notifications.title')}</p>
        <div className="flex items-center gap-1">
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => dispatch(notificationsActions.markAllReadRequested())}
            >
              {t('notifications.markAllRead')}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleSeeAll}
          >
            {t('notifications.seeAll')}
          </Button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {status === 'loading' && items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('notifications.loading')}
          </p>
        ) : null}
        {status !== 'loading' && items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('notifications.empty')}
          </p>
        ) : null}
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60',
                  !item.readAt && 'bg-primary/5',
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

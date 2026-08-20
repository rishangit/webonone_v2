import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { notificationsActions } from '../store/notificationsSlice'
import { NotificationPanel } from './NotificationPanel'
import { useNotificationToasts } from '../hooks/useNotificationToasts'

export function NotificationBell() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation('shell')
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)
  const [open, setOpen] = useState(false)

  useNotificationToasts()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      dispatch(notificationsActions.listRequested({ mode: 'replace', limit: 20 }))
    }
  }

  const badge =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('relative h-9 w-9 shrink-0', open && 'border-primary text-primary')}
          aria-label={t('notifications.open')}
          aria-expanded={open}
        >
          <Bell className="h-4 w-4" />
          {badge ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { notificationsActions } from '../store/notificationsSlice'
import { NotificationPanel } from './NotificationPanel'
import { useNotificationToasts } from '../hooks/useNotificationToasts'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

function getShellOverlayRoot(): HTMLElement {
  return document.getElementById('shell-overlay-root') ?? document.body
}

function getShellSlideHost(): HTMLElement {
  return document.getElementById('shell-slide-host') ?? document.body
}

const mobilePanelClassName = cn(
  'app-shell-slide-panel app-shell-slide-panel--anchored app-shell-slide-panel--full-width',
  'bottom-auto z-40 flex h-auto max-h-80 flex-col overflow-hidden rounded-lg border border-[hsl(var(--glass-border))] p-0 outline-none',
  'glass-menu text-popover-foreground shadow-md',
)

export function NotificationBell() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation(['shell', 'common'])
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  useNotificationToasts()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      dispatch(notificationsActions.listRequested({ mode: 'replace', limit: 20 }))
    }
  }

  useEffect(() => {
    if (!isMobile || !open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobile, open])

  const badge =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null

  const bellButton = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn('relative h-9 w-9 shrink-0', open && 'border-primary text-primary')}
      aria-label={t('notifications.open')}
      aria-expanded={open}
      onClick={isMobile ? () => handleOpenChange(!open) : undefined}
    >
      <Bell className="h-4 w-4" />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Button>
  )

  if (isMobile) {
    return (
      <>
        {bellButton}
        {open ? (
          <>
            {createPortal(
              <button
                type="button"
                className="app-shell-mobile-nav-overlay bg-black/50"
                aria-label={t('common:close')}
                onClick={() => setOpen(false)}
              />,
              getShellOverlayRoot(),
            )}
            {createPortal(
              <div className={mobilePanelClassName} role="dialog" aria-label={t('notifications.title')}>
                <NotificationPanel onClose={() => setOpen(false)} />
              </div>,
              getShellSlideHost(),
            )}
          </>
        ) : null}
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{bellButton}</PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-auto p-0">
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

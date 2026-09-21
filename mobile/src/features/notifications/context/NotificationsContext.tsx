import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AppState, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useToast } from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import {
  notificationsApi,
  type NotificationItem,
} from '@/features/notifications/services/notificationsApi'
import { useSession } from '@/features/auth/SessionContext'
import {
  notificationIdFromData,
  registerPushDevice,
  resolvePushHref,
} from '@/features/notifications/utils/pushNotifications'

const POLL_INTERVAL_MS = 30_000

type NotificationsContextValue = {
  items: NotificationItem[]
  unreadCount: number
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  refreshList: (limit?: number) => Promise<void>
  loadMore: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession()
  const { toast } = useToast()
  const { t } = useTranslation('shell')
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousUnreadRef = useRef<number | null>(null)
  const listLimitRef = useRef(20)
  const handledPushRef = useRef<string | null>(null)
  const lastPushReceivedAtRef = useRef(0)

  const pollUnread = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { count } = await notificationsApi.unreadCount()
      const previous = previousUnreadRef.current
      const pushRecentlyHandled = Date.now() - lastPushReceivedAtRef.current < 15_000
      const appActive = AppState.currentState === 'active'
      if (
        appActive &&
        !pushRecentlyHandled &&
        previous !== null &&
        count > previous
      ) {
        const list = await notificationsApi.list({ limit: 1 })
        const latestTitle = list.items[0]?.title
        if (latestTitle) {
          toast({ title: latestTitle })
        }
      }
      previousUnreadRef.current = count
      setUnreadCount(count)
    } catch {
      /* polling is best-effort */
    }
  }, [isAuthenticated, toast])

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([])
      setUnreadCount(0)
      previousUnreadRef.current = null
      return
    }
    void pollUnread()
    const handle = setInterval(() => void pollUnread(), POLL_INTERVAL_MS)
    return () => clearInterval(handle)
  }, [isAuthenticated, pollUnread])

  const refreshList = useCallback(async (limit = listLimitRef.current) => {
    if (!isAuthenticated) return
    listLimitRef.current = limit
    setLoading(true)
    setError(null)
    try {
      const data = await notificationsApi.list({ limit })
      setItems(data.items ?? [])
      setHasMore((data.items?.length ?? 0) >= limit)
      await pollUnread()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notifications.loading'))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, pollUnread, t])

  const loadMore = useCallback(async () => {
    if (!isAuthenticated || loadingMore || !hasMore || items.length === 0) return
    const last = items[items.length - 1]
    setLoadingMore(true)
    setError(null)
    try {
      const data = await notificationsApi.list({ limit: 50, before: last.id })
      const next = data.items ?? []
      setItems((current) => [...current, ...next])
      setHasMore(next.length >= 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notifications.loading'))
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, isAuthenticated, items, loadingMore, t])

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id)
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
    )
    setUnreadCount((count) => Math.max(0, count - 1))
    previousUnreadRef.current = Math.max(0, (previousUnreadRef.current ?? 0) - 1)
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead()
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    )
    setUnreadCount(0)
    previousUnreadRef.current = 0
  }, [])

  const openPushResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier
      if (handledPushRef.current === identifier) return
      handledPushRef.current = identifier

      const data = response.notification.request.content.data
      const notificationId = notificationIdFromData(data)
      if (notificationId) {
        try {
          await markRead(notificationId)
        } catch {
          /* navigation still proceeds */
        }
      }
      const href = resolvePushHref(data)
      if (href) router.push(href)
    },
    [markRead, router],
  )

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return
    void registerPushDevice()

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      lastPushReceivedAtRef.current = Date.now()
      void pollUnread()
    })

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      void openPushResponse(response)
    })
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) void openPushResponse(response)
    })
    return () => {
      receivedSub.remove()
      sub.remove()
    }
  }, [isAuthenticated, openPushResponse, pollUnread])

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      error,
      refreshList,
      loadMore,
      markRead,
      markAllRead,
    }),
    [
      error,
      hasMore,
      items,
      loadMore,
      loading,
      loadingMore,
      markAllRead,
      markRead,
      refreshList,
      unreadCount,
    ],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}

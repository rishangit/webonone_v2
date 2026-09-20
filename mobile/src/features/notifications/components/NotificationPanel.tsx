import { useEffect } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Body, Button, Muted, Subheading } from '@webonone/mobile-ui'
import { useNotifications } from '@/features/notifications/context/NotificationsContext'
import type { NotificationItem } from '@/features/notifications/services/notificationsApi'
import { formatNotificationRelative } from '@/features/notifications/utils/formatNotificationRelative'
import { resolveNotificationHref } from '@/features/notifications/utils/notificationNavigation'
import { getAppI18n } from '@/i18n'

type NotificationPanelProps = {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { t } = useTranslation('shell')
  const router = useRouter()
  const { items, unreadCount, loading, refreshList, markRead, markAllRead } = useNotifications()

  useEffect(() => {
    void refreshList(20)
  }, [refreshList])

  async function handleOpen(item: NotificationItem) {
    if (!item.readAt) {
      await markRead(item.id)
    }
    onClose()
    const href = resolveNotificationHref(item.href)
    if (href) {
      router.push(href)
    }
  }

  function handleSeeAll() {
    onClose()
    router.push('/notifications' as Href)
  }

  return (
    <View className="max-h-80 w-full min-w-0">
      <View className="flex-row items-center justify-between gap-2 border-b border-border px-3 py-2">
        <Subheading className="text-sm">{t('notifications.title')}</Subheading>
        <View className="flex-row items-center gap-1">
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onPress={() => void markAllRead()}>
              {t('notifications.markAllRead')}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onPress={handleSeeAll}>
            {t('notifications.seeAll')}
          </Button>
        </View>
      </View>

      <ScrollView className="max-h-72">
        {loading && items.length === 0 ? (
          <Muted className="px-3 py-6 text-center text-sm">{t('notifications.loading')}</Muted>
        ) : null}
        {!loading && items.length === 0 ? (
          <Muted className="px-3 py-6 text-center text-sm">{t('notifications.empty')}</Muted>
        ) : null}
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => void handleOpen(item)}
            className={`border-b border-border px-3 py-2.5 ${!item.readAt ? 'bg-primary/5' : ''}`}
          >
            <View className="flex-row items-start justify-between gap-2">
              <Body className={`flex-1 text-sm ${!item.readAt ? 'font-semibold' : 'font-medium'}`}>
                {item.title}
              </Body>
              <Muted className="shrink-0 text-[11px]">
                {formatNotificationRelative(item.createdAt, getAppI18n().language)}
              </Muted>
            </View>
            {item.body ? (
              <Muted className="mt-0.5 text-xs" numberOfLines={2}>
                {item.body}
              </Muted>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

import { View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
} from '@webonone/mobile-ui'
import { useNotifications } from '@/features/notifications/context/NotificationsContext'
import type { NotificationItem } from '@/features/notifications/services/notificationsApi'
import { formatNotificationRelative } from '@/features/notifications/utils/formatNotificationRelative'
import { resolveNotificationHref } from '@/features/notifications/utils/notificationNavigation'
import { getAppI18n } from '@/i18n'

export function NotificationsList() {
  const { t } = useTranslation('shell')
  const router = useRouter()
  const { items, markRead } = useNotifications()

  if (items.length === 0) {
    return <ItemListEmpty>{t('notifications.empty')}</ItemListEmpty>
  }

  async function handleOpen(item: NotificationItem) {
    if (!item.readAt) {
      await markRead(item.id)
    }
    const href = resolveNotificationHref(item.href)
    if (href) {
      router.push(href)
    }
  }

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id} onPress={() => void handleOpen(item)}>
          <View className="min-w-0 flex-1 gap-1">
            <View className="flex-row items-start justify-between gap-2">
              <ItemListContent
                title={item.title}
                subtitle={item.body ?? undefined}
              />
              <Muted className="shrink-0 text-[11px]">
                {formatNotificationRelative(item.createdAt, getAppI18n().language)}
              </Muted>
            </View>
          </View>
        </ItemListItem>
      ))}
    </ItemList>
  )
}

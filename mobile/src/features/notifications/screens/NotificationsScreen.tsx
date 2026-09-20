import { useEffect } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  FeatureScreen,
  ListPageBody,
  Spinner,
} from '@webonone/mobile-ui'
import { NotificationsList } from '@/features/notifications/components/NotificationsList'
import { useNotifications } from '@/features/notifications/context/NotificationsContext'

export function NotificationsScreen() {
  const { t } = useTranslation('shell')
  const { unreadCount, loading, loadingMore, hasMore, error, refreshList, loadMore, markAllRead } =
    useNotifications()

  useEffect(() => {
    void refreshList(50)
  }, [refreshList])

  return (
    <FeatureScreen
      title={t('notifications.listTitle')}
      description={t('notifications.listDescription')}
      actions={
        unreadCount > 0 ? (
          <Button variant="outline" size="sm" onPress={() => void markAllRead()}>
            {t('notifications.markAllRead')}
          </Button>
        ) : undefined
      }
    >
      {loading ? <Spinner label={t('notifications.loading')} /> : null}
      {!loading && error ? <Body className="text-destructive">{error}</Body> : null}

      {!loading ? (
        <ListPageBody>
          <NotificationsList />
          {hasMore ? (
            <View className="items-center py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onPress={() => void loadMore()}
              >
                {t('notifications.loadMore')}
              </Button>
            </View>
          ) : null}
        </ListPageBody>
      ) : null}
    </FeatureScreen>
  )
}

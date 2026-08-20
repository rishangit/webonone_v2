import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ListPageBody,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { NotificationsList } from '../components/NotificationsList'
import { notificationsActions } from '../store/notificationsSlice'

const PAGE_LIMIT = 50

export function NotificationsPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation('shell')
  const items = useAppSelector((s) => s.notifications.items)
  const status = useAppSelector((s) => s.notifications.status)
  const error = useAppSelector((s) => s.notifications.error)
  const hasMore = useAppSelector((s) => s.notifications.hasMore)
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)

  const loadingFirstPage = status === 'loading' && items.length === 0
  usePlatformLoading(loadingFirstPage ? t('notifications.loading') : null)

  useEffect(() => {
    dispatch(notificationsActions.listRequested({ mode: 'replace', limit: PAGE_LIMIT }))
  }, [dispatch])

  function handleLoadMore() {
    const last = items[items.length - 1]
    if (!last || status === 'loading') return
    dispatch(
      notificationsActions.listRequested({
        mode: 'append',
        limit: PAGE_LIMIT,
        before: last.id,
      }),
    )
  }

  return (
    <FeaturePage
      title={t('notifications.listTitle')}
      description={t('notifications.listDescription')}
      actions={
        unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatch(notificationsActions.markAllReadRequested())}
          >
            {t('notifications.markAllRead')}
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!loadingFirstPage ? <NotificationsList items={items} /> : null}
        </div>
        {hasMore ? (
          <div className="mt-auto flex justify-center py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={status === 'loading'}
              onClick={handleLoadMore}
            >
              {t('notifications.loadMore')}
            </Button>
          </div>
        ) : null}
      </ListPageBody>
    </FeaturePage>
  )
}

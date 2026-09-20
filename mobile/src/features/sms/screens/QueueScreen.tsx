import { useState } from 'react'
import {
  Badge,
  Body,
  Button,
  FeatureScreen,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListPageBody,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { smsAdminApi, type SmsAdminQueueItem } from '@/shared/services/smsAdminApi'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

export function QueueScreen() {
  const { t } = useTranslation('smsQueue')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  const list = useServerPaginatedList<SmsAdminQueueItem>({
    pageSize: 24,
    fetchPage: async (query) => {
      const result = await smsAdminApi.listQueue({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 24),
      })
      return {
        items: result.items,
        total: result.total,
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 24),
      }
    },
  })

  const onScroll = useListPageScroll(list)

  async function retry(id: string) {
    setBusyId(id)
    try {
      await smsAdminApi.retryQueueItem(id)
      toast({ title: 'Message queued again' })
      list.reload()
    } catch (err) {
      toast({
        title: 'Retry failed',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <FeatureScreen
      title={t('title')}
      description={t('description')}
      onScroll={onScroll}
      actions={
        <Button size="sm" variant="outline" onPress={() => list.reload()}>
          {tc('refresh')}
        </Button>
      }
    >
      {list.loading ? <Spinner label={t('loading')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}
      {!list.loading && list.items.length === 0 ? <ItemListEmpty>{t('empty')}</ItemListEmpty> : null}
      {!list.loading && list.items.length > 0 ? (
        <ListPageBody>
          <ItemList>
            {list.items.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent
                  title={item.toNumber}
                  subtitle={item.templateSlug ?? item.lastError ?? item.status}
                />
                <Badge
                  tone={
                    item.status === 'failed'
                      ? 'danger'
                      : item.status === 'processing'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {item.status}
                </Badge>
                {item.status === 'failed' ? (
                  <Button size="sm" loading={busyId === item.id} onPress={() => void retry(item.id)}>
                    {t('retry')}
                  </Button>
                ) : null}
              </ItemListItem>
            ))}
          </ItemList>
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}
    </FeatureScreen>
  )
}

import {
  Badge,
  Body,
  Button,
  FeatureScreen,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { smsAdminApi, type SmsAdminHistoryItem } from '@/shared/services/smsAdminApi'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

export function HistoryScreen() {
  const { t } = useTranslation('smsShell')
  const { t: tc } = useTranslation('common')
  const list = useServerPaginatedList<SmsAdminHistoryItem>({
    pageSize: 24,
    fetchPage: async (query) => {
      const result = await smsAdminApi.getHistory({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 24),
        search: query.q as string | undefined,
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
  const emptyMessage = t('historyEmpty')

  return (
    <FeatureScreen
      title={t('historyTitle')}
      description={t('historyDescription')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <Button size="sm" variant="outline" onPress={() => list.reload()}>
            {tc('refresh')}
          </Button>
        </ListPageActions>
      }
    >
      <SearchInput
        placeholder={t('historySearchPlaceholder')}
        value={list.searchQuery}
        onChangeText={list.setSearchQuery}
        onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
        accessibilityLabel={t('historySearchAria')}
      />
      {list.loading ? <Spinner label={t('loadingHistory')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}
      {!list.loading && list.items.length === 0 ? <ItemListEmpty>{emptyMessage}</ItemListEmpty> : null}
      {!list.loading && list.items.length > 0 ? (
        <ListPageBody>
          <ItemList>
            {list.items.map((item) => (
              <ItemListItem key={item.id}>
                <ItemListContent
                  title={item.toNumber}
                  subtitle={item.templateSlug ?? item.errorMessage ?? undefined}
                />
                <Badge tone={item.status === 'sent' ? 'success' : 'danger'}>{item.status}</Badge>
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

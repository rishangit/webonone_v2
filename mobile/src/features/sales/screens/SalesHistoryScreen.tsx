import { Redirect, useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  NativeSelect,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useSession } from '@/features/auth/SessionContext'
import { SalesList } from '@/features/sales/components/SalesList'
import { salesApi } from '@/features/sales/services/salesApi'
import { canAccessCompanySession } from '@/features/sales/utils/canAccessCompanySession'
import { SALES_POS_PATH, saleDetailPath } from '@/features/sales/utils/salePaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

function statusOptions(t: (key: string) => string) {
  return [
    { value: 'all', label: t('history.statusAll') },
    { value: 'completed', label: t('status.completed') },
    { value: 'void', label: t('status.void') },
  ]
}

export function SalesHistoryScreen() {
  const { t } = useTranslation('sales')
  const router = useRouter()
  const { user } = useSession()
  const canAccess = canAccessCompanySession(user?.role, user?.companyId)

  const list = useServerPaginatedList({
    fetchPage: async (query) =>
      salesApi.list({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: query.q as string | undefined,
        status: (query.status as 'all' | 'completed' | 'void') ?? 'all',
      }),
  })

  const status = String(list.queryParams.status ?? 'all')
  const onScroll = useListPageScroll(list)
  const emptyMessage = t('history.empty')

  if (user && !canAccess) {
    return <Redirect href="/" />
  }

  return (
    <FeatureScreen
      title={t('history.title')}
      description={t('history.description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            placeholder={t('history.searchPlaceholder')}
            accessibilityLabel={t('history.searchAria')}
          />
          <ListAddButton onPress={() => router.push(SALES_POS_PATH as Href)}>{t('history.newSale')}</ListAddButton>
        </ListPageActions>
      }
    >
      <NativeSelect
        label={t('history.status')}
        value={status}
        onValueChange={(value) => list.patchQueryParams({ status: value })}
        options={statusOptions(t)}
        allowEmpty={false}
      />

      {list.loading ? <Spinner label={t('history.loading')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <SalesList
            items={list.items}
            emptyMessage={emptyMessage}
            onOpen={(saleId) => router.push(saleDetailPath(saleId) as Href)}
          />
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

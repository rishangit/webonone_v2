import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect, useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { FindCompanyDialog } from '@/features/companies/components/FindCompanyDialog'
import { MyCompaniesList } from '@/features/companies/components/MyCompaniesList'
import { companyApi } from '@/features/companies/services/companyApi'
import { CONNECTED_COMPANIES_PATH } from '@/features/companies/utils/companyPaths'
import { useClientInfiniteList } from '@/shared/hooks/useClientInfiniteList'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'

const PAGE_SIZE = 12

export function ConnectedCompaniesScreen() {
  const { t } = useTranslation('settings')
  const router = useRouter()
  const [items, setItems] = useState<Awaited<ReturnType<typeof companyApi.listMyCompanies>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [findOpen, setFindOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await companyApi.listMyCompanies()
      setItems(next.filter((item) => item.role === 'member'))
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const query = searchQuery.trim().toLowerCase()
  const filteredItems = useMemo(() => {
    if (!query) return items
    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [items, query])

  const pagination = useClientInfiniteList(filteredItems, PAGE_SIZE, query)
  const onScroll = useListPageScroll(pagination)
  const emptyMessage = t('connectedCompanies.empty')

  return (
    <FeatureScreen
      title={t('connectedCompanies.title')}
      description={t('connectedCompanies.description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={searchQuery ? () => setSearchQuery('') : undefined}
            placeholder={t('connectedCompanies.searchPlaceholder')}
            accessibilityLabel={t('connectedCompanies.searchAria')}
          />
          <ListAddButton onPress={() => setFindOpen(true)}>{t('connectedCompanies.findCompanies')}</ListAddButton>
        </ListPageActions>
      }
    >
      {loading ? <Spinner label={t('connectedCompanies.loading')} /> : null}
      {!loading && error ? <Body className="text-destructive">{error}</Body> : null}

      {!loading ? (
        <ListPageBody>
          <MyCompaniesList
            items={pagination.visibleItems}
            emptyMessage={emptyMessage}
            listPath={CONNECTED_COMPANIES_PATH}
            onOpenProfile={(id) => router.push(`${CONNECTED_COMPANIES_PATH}/${id}` as Href)}
          />
          <TranslatedListPageFooter
            loadedCount={pagination.loadedCount}
            totalCount={pagination.totalCount}
            hasMore={pagination.hasMore}
            loadingMore={pagination.loadingMore}
          />
        </ListPageBody>
      ) : null}

      <FindCompanyDialog open={findOpen} onOpenChange={setFindOpen} onConnected={() => void load()} />
    </FeatureScreen>
  )
}

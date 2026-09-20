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
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useTranslation } from 'react-i18next'
import { CompanyFormDialog } from '@/features/companies/components/CompanyFormDialog'
import { MyCompaniesList } from '@/features/companies/components/MyCompaniesList'
import { companyApi } from '@/features/companies/services/companyApi'
import { MY_COMPANIES_PATH } from '@/features/companies/utils/companyPaths'
import { useClientInfiniteList } from '@/shared/hooks/useClientInfiniteList'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'

const PAGE_SIZE = 12

export function MyCompaniesScreen() {
  const { t } = useTranslation('settings')
  const router = useRouter()
  const [items, setItems] = useState<Awaited<ReturnType<typeof companyApi.listMyCompanies>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await companyApi.listMyCompanies()
      setItems(next.filter((item) => item.role === 'company_admin'))
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
  const emptyMessage = t('myCompanies.empty')

  return (
    <FeatureScreen
      title={t('myCompanies.title')}
      description={t('myCompanies.description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={searchQuery ? () => setSearchQuery('') : undefined}
            placeholder={t('myCompanies.searchPlaceholder')}
            accessibilityLabel={t('myCompanies.searchAria')}
          />
          <ListAddButton onPress={() => setRegisterOpen(true)}>{t('myCompanies.addCompany')}</ListAddButton>
        </ListPageActions>
      }
    >
      {loading ? <Spinner label={t('myCompanies.loading')} /> : null}
      {!loading && error ? <Body className="text-destructive">{error}</Body> : null}

      {!loading ? (
        <ListPageBody>
          <MyCompaniesList
            items={pagination.visibleItems}
            emptyMessage={emptyMessage}
            listPath={MY_COMPANIES_PATH}
            onOpenProfile={(id) => router.push(`${MY_COMPANIES_PATH}/${id}` as Href)}
          />
          <TranslatedListPageFooter
            loadedCount={pagination.loadedCount}
            totalCount={pagination.totalCount}
            hasMore={pagination.hasMore}
            loadingMore={pagination.loadingMore}
          />
        </ListPageBody>
      ) : null}

      <CompanyFormDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSaved={() => void load()}
      />
    </FeatureScreen>
  )
}

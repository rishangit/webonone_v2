import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFocusEffect, useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useSession } from '@/features/auth/SessionContext'
import { AdminCompaniesList } from '@/features/companies/components/AdminCompaniesList'
import { companyApi, type CompanyStatus } from '@/features/companies/services/companyApi'
import { ALL_COMPANIES_PATH } from '@/features/companies/utils/companyPaths'
import { useClientInfiniteList } from '@/shared/hooks/useClientInfiniteList'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'

const PAGE_SIZE = 12

export function AllCompaniesScreen() {
  const { t } = useTranslation('settings')
  const router = useRouter()
  const { user } = useSession()
  const { toast } = useToast()
  const [items, setItems] = useState<Awaited<ReturnType<typeof companyApi.listAllCompanies>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const isSuperAdmin = user?.role === 'super_admin'

  const load = useCallback(async () => {
    if (!isSuperAdmin) return
    setLoading(true)
    setError(null)
    try {
      setItems(await companyApi.listAllCompanies())
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin])

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

  useEffect(() => {
    if (user && !isSuperAdmin) {
      router.replace('/' as Href)
    }
  }, [isSuperAdmin, router, user])

  async function handleStatusChange(id: string, status: CompanyStatus) {
    setUpdatingId(id)
    try {
      await companyApi.updateCompanyStatus(id, status)
      toast({ title: 'Company status updated' })
      await load()
    } catch (err) {
      toast({
        title: 'Could not update status',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (!user || !isSuperAdmin) {
    return <Spinner label={t('companiesAdmin.loading')} />
  }

  const emptyMessage = t('companiesAdmin.empty')

  return (
    <FeatureScreen
      title={t('companiesAdmin.title')}
      description={t('companiesAdmin.description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={searchQuery ? () => setSearchQuery('') : undefined}
            placeholder={t('companiesAdmin.searchPlaceholder')}
            accessibilityLabel={t('companiesAdmin.searchAria')}
          />
        </ListPageActions>
      }
    >
      {loading ? <Spinner label={t('companiesAdmin.loading')} /> : null}
      {!loading && error ? <Body className="text-destructive">{error}</Body> : null}

      {!loading ? (
        <ListPageBody>
          <AdminCompaniesList
            items={pagination.visibleItems}
            updatingId={updatingId}
            emptyMessage={emptyMessage}
            onOpenProfile={(id) => router.push(`${ALL_COMPANIES_PATH}/${id}` as Href)}
            onStatusChange={(id, status) => void handleStatusChange(id, status)}
          />
          <TranslatedListPageFooter
            loadedCount={pagination.loadedCount}
            totalCount={pagination.totalCount}
            hasMore={pagination.hasMore}
            loadingMore={pagination.loadingMore}
          />
        </ListPageBody>
      ) : null}
    </FeatureScreen>
  )
}

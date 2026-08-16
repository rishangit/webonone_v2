import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListPageBody,
  ListPageFooter,
  SearchInput,
  useClientListPage,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { MyCompaniesList } from '../components/MyCompaniesList'

export function ConnectedCompaniesPage() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const {
    myCompanies,
    myCompaniesStatus,
    myCompaniesError,
    myCompaniesFetchedAt,
  } = useAppSelector((s) => s.companies)

  const [searchQuery, setSearchQuery] = useState('')

  const connectedCompanies = useMemo(
    () => myCompanies.filter((item) => item.role === 'member'),
    [myCompanies],
  )

  const awaitingFirstLoad =
    myCompaniesFetchedAt === null && myCompanies.length === 0 && myCompaniesStatus !== 'error'

  usePlatformLoading(awaitingFirstLoad ? t('connectedCompanies.loading') : null)

  useEffect(() => {
    if (!isFresh(myCompaniesFetchedAt)) {
      dispatch(companiesActions.loadMyCompaniesRequested())
    }
  }, [dispatch, myCompaniesFetchedAt])

  const filteredItems = searchQuery.trim()
    ? connectedCompanies.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : connectedCompanies

  const listPage = useClientListPage(filteredItems)
  const visibleItems = listPage.visible

  if (awaitingFirstLoad) {
    return null
  }

  return (
    <FeaturePage
      title={t('connectedCompanies.title')}
      description={t('connectedCompanies.description')}
      actions={
        <SearchInput
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
          }}
          placeholder={t('connectedCompanies.searchPlaceholder')}
          aria-label={t('connectedCompanies.searchAria')}
          className="w-64"
        />
      }
    >
      {myCompaniesError ? (
        <Alert variant="destructive">
          <AlertDescription>{myCompaniesError}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          <MyCompaniesList items={visibleItems} emptyMessage={t('connectedCompanies.empty')} />
        </div>
        <ListPageFooter
          className="mt-auto"
          totalCount={listPage.total}
          currentPage={listPage.page}
          pageSize={listPage.pageSize}
          pageSizeOptions={[12, 24, 48]}
          loadedCount={listPage.loadedCount}
          hasMore={listPage.hasMore}
          onPageChange={listPage.setPage}
          onPageSizeChange={listPage.setPageSize}
          onLoadMore={listPage.loadMore}
        />
      </ListPageBody>
    </FeaturePage>
  )
}

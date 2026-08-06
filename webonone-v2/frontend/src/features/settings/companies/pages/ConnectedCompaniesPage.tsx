import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListPageBody,
  SearchInput,
  Pagination,
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

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')

  const connectedCompanies = useMemo(
    () => myCompanies.filter((item) => item.role === 'member'),
    [myCompanies],
  )

  const awaitingFirstLoad =
    myCompaniesFetchedAt === null && myCompanies.length === 0 && myCompaniesStatus !== 'error'

  usePlatformLoading(awaitingFirstLoad ? t('loadingCompanies') : null)

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

  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  if (awaitingFirstLoad) {
    return null
  }

  return (
    <FeaturePage
      title={t('connectedCompanies')}
      description={t('connectedCompaniesDescription')}
      actions={
        <SearchInput
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
            setPage(1)
          }}
          placeholder={t('companyName')}
          onClear={() => setPage(1)}
          aria-label={t('searchConnected')}
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
          <MyCompaniesList items={visibleItems} emptyMessage={t('noConnectedCompanies')} />
        </div>
        <Pagination
          className="mt-auto"
          totalCount={filteredItems.length}
          currentPage={page}
          pageSize={pageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPage(1)
          }}
        />
      </ListPageBody>
    </FeaturePage>
  )
}

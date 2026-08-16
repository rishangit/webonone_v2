import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { CompaniesList } from '../components/CompaniesList'
import { useSuperAdminStatus } from '../hooks/useSuperAdminStatus'
import type { CompanyStatus } from '../services/companyApi'
import { companiesActions } from '../store/companiesStore'

export function CompaniesPage() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const { isSuperAdmin, loading: roleLoading } = useSuperAdminStatus()
  const { adminItems, adminListStatus, adminListError, updatingId, adminListFetchedAt } =
    useAppSelector((s) => s.companies)
  const [searchQuery, setSearchQuery] = useState('')

  const loading = adminListStatus === 'loading'
  const error = adminListError

  usePlatformLoading(roleLoading ? t('common:loading') : loading ? t('companiesAdmin.loading') : null)

  const filteredItems = searchQuery.trim()
    ? adminItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : adminItems

  useEffect(() => {
    if (roleLoading || !isSuperAdmin) return
    if (!isFresh(adminListFetchedAt)) {
      dispatch(companiesActions.loadAdminCompaniesRequested())
    }
  }, [dispatch, isSuperAdmin, roleLoading, adminListFetchedAt])

  function handleStatusChange(id: string, status: CompanyStatus) {
    dispatch(companiesActions.updateCompanyStatusRequested({ id, status }))
  }

  const listPage = useClientListPage(filteredItems)
  const visibleItems = listPage.visible

  if (!roleLoading && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage
      title={t('companiesAdmin.title')}
      description={t('companiesAdmin.description')}
      actions={
        <SearchInput
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
          }}
          placeholder={t('companiesAdmin.searchPlaceholder')}
          aria-label={t('companiesAdmin.searchAria')}
          className="w-64"
        />
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!loading ? (
            <CompaniesList items={visibleItems} updatingId={updatingId} onStatusChange={handleStatusChange} />
          ) : null}
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

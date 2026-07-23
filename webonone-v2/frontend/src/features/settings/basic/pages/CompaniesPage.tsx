import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListPageBody,
  SearchInput,
  Pagination,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { CompaniesList } from '../components/CompaniesList'
import { useSuperAdminStatus } from '../hooks/useSuperAdminStatus'
import type { CompanyStatus } from '../services/companyApi'
import { companiesActions } from '../store/companiesStore'

export function CompaniesPage() {
  const dispatch = useAppDispatch()
  const { isSuperAdmin, loading: roleLoading } = useSuperAdminStatus()
  const { adminItems, adminListStatus, adminListError, updatingId, adminListFetchedAt } =
    useAppSelector((s) => s.companies)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')

  const loading = adminListStatus === 'loading'
  const error = adminListError

  usePlatformLoading(
    roleLoading ? 'Loading…' : loading ? 'Loading companies…' : null,
  )

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

  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  if (!roleLoading && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage
      title="Companies"
      description="Review registered companies and update approval status."
      actions={
        <SearchInput
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Company name"
          onClear={() => setPage(1)}
          aria-label="Search companies"
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

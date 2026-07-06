import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListPageBody,
  ListSearchField,
  Pagination,
} from '@webonone/ui-kit'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { CompaniesList } from '../components/CompaniesList'
import { useSuperAdminStatus } from '../hooks/useSuperAdminStatus'
import { companyApi, type AdminCompany, type CompanyStatus } from '../services/companyApi'

export function CompaniesPage() {
  const { isSuperAdmin, loading: roleLoading } = useSuperAdminStatus()
  const [items, setItems] = useState<AdminCompany[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  usePlatformLoading(
    roleLoading ? 'Loading…' : loading ? 'Loading companies…' : null,
  )

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => item.name.toLowerCase().includes(query))
  }, [items, searchQuery])

  useEffect(() => {
    if (roleLoading || !isSuperAdmin) return

    async function loadCompanies() {
      setLoading(true)
      setError(null)
      try {
        const data = await companyApi.listAllCompanies()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies')
      } finally {
        setLoading(false)
      }
    }

    void loadCompanies()
  }, [isSuperAdmin, roleLoading])

  async function handleStatusChange(id: string, status: CompanyStatus) {
    setUpdatingId(id)
    setError(null)
    try {
      await companyApi.updateCompanyStatus(id, status)
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                approvedAt: status === 'approved' ? new Date().toISOString() : null,
              }
            : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed')
    } finally {
      setUpdatingId(null)
    }
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
        <ListSearchField
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value)
            setPage(1)
          }}
          placeholder="Company name"
          onClear={() => setPage(1)}
          aria-label="Search companies"
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

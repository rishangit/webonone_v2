import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { CompaniesList } from '../components/CompaniesList'
import { useSuperAdminStatus } from '../hooks/useSuperAdminStatus'
import { companyApi, type AdminCompany, type CompanyStatus } from '../services/companyApi'

export function CompaniesPage() {
  const { isSuperAdmin, loading: roleLoading } = useSuperAdminStatus()
  const [items, setItems] = useState<AdminCompany[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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

  if (roleLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review registered companies and update approval status.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <p className="text-sm text-muted-foreground">Loading companies…</p> : null}

      {!loading ? (
        <CompaniesList items={items} updatingId={updatingId} onStatusChange={handleStatusChange} />
      ) : null}
    </div>
  )
}

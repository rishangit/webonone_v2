import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@webonone/ui-kit'
import { companyApi, type PendingCompany } from '../services/companyApi'
import { clearSuperAdminSession, getSuperAdminDisplayName, getSuperAdminToken } from '../utils/superAdminSession'

export function PendingCompaniesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<PendingCompany[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const displayName = getSuperAdminDisplayName()

  useEffect(() => {
    if (!getSuperAdminToken()) {
      navigate('/admin/companies/login', { replace: true })
      return
    }

    void loadPending()
  }, [navigate])

  async function loadPending() {
    setLoading(true)
    setError(null)
    try {
      const data = await companyApi.listPendingCompanies()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending companies')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setApprovingId(id)
    setError(null)
    try {
      await companyApi.approveCompany(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApprovingId(null)
    }
  }

  function handleLogout() {
    clearSuperAdminSession()
    navigate('/admin/companies/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pending Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {displayName ?? 'Super Admin'}
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Sign out
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending company registrations.</p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div className="flex items-center gap-4">
              {item.logoUrl ? (
                <img src={item.logoUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs">No logo</div>
              )}
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Registrant: {item.createdByUserId} · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <Button onClick={() => handleApprove(item.id)} disabled={approvingId === item.id}>
              {approvingId === item.id ? 'Approving…' : 'Approve'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, AlertDescription, FeaturePage, Pagination, Spinner } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { emailApi } from '@/shared/services/emailApi'
import type { EmailTemplate } from '@/shared/types/email.types'
import { TemplatesList } from '../components/TemplatesList'

export function TemplatesPage() {
  const { accessToken } = useAppSelector((s) => s.auth)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadTemplates() {
    setLoading(true)
    setError(null)
    try {
      const data = await emailApi.listTemplates()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!accessToken) {
      return
    }
    void loadTemplates()
  }, [accessToken])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  async function handleToggleActive(template: EmailTemplate) {
    setBusyId(template.id)
    setError(null)
    try {
      const updated = await emailApi.setTemplateActive(template.id, !template.isActive)
      setTemplates((current) => current.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setBusyId(null)
    }
  }

  const visibleTemplates = templates.slice((page - 1) * pageSize, page * pageSize)

  return (
    <FeaturePage
      title="Templates"
      description="Manage platform and company email templates."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : null}

      {!loading ? (
        <>
          <TemplatesList
            templates={visibleTemplates}
            onToggleActive={handleToggleActive}
            busyId={busyId}
          />
          <Pagination
            totalCount={templates.length}
            currentPage={page}
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50]}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize)
              setPage(1)
            }}
          />
        </>
      ) : null}
    </FeaturePage>
  )
}

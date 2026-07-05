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
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { emailApi } from '@/shared/services/emailApi'
import type { EmailTemplate } from '@/shared/types/email.types'
import { TemplatesList } from '../components/TemplatesList'

export function TemplatesPage() {
  const { accessToken } = useAppSelector((s) => s.auth)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  usePlatformLoading(loading ? 'Loading templates…' : null)

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return templates
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.slug.toLowerCase().includes(query),
    )
  }, [templates, searchQuery])

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

  const visibleTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize)

  return (
    <FeaturePage
      title="Templates"
      description="Manage platform and company email templates."
      actions={
        <ListSearchField
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value)
            setPage(1)
          }}
          placeholder="Template name or slug"
          onClear={() => setPage(1)}
          aria-label="Search templates"
        />
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            <TemplatesList
              templates={visibleTemplates}
              onToggleActive={handleToggleActive}
              busyId={busyId}
            />
          </div>
          <Pagination
            className="mt-auto"
            totalCount={filteredTemplates.length}
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
      ) : null}
    </FeaturePage>
  )
}

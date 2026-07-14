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
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'
import { TemplatesList } from '../components/TemplatesList'

export function TemplatesPage() {
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { items: templates, listStatus, listError, togglingId } = useAppSelector((s) => s.templates)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')

  const loading = listStatus === 'loading' && templates.length === 0
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

  useEffect(() => {
    if (!accessToken) return
    dispatch(templatesActions.loadListRequested())
  }, [accessToken, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function handleToggleActive(template: (typeof templates)[number]) {
    dispatch(
      templatesActions.setActiveRequested({ id: template.id, isActive: !template.isActive }),
    )
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
      {listError ? (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            <TemplatesList
              templates={visibleTemplates}
              onToggleActive={handleToggleActive}
              busyId={togglingId}
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

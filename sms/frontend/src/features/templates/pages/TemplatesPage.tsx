import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ListPageBody,
  ListSearchField,
  Pagination,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'
import type { SmsTemplate } from '@/shared/types/sms.types'
import type { CreateTemplateBody } from '@/shared/services/smsApi'
import { TemplatesList } from '../components/TemplatesList'
import { TemplateCreateDialog } from '../components/TemplateCreateDialog'

export function TemplatesPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { accessToken } = useAppSelector((s) => s.auth)
  const role = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const {
    items: templates,
    listStatus,
    listError,
    togglingId,
    deletingId,
    createStatus,
    createError,
    createdId,
  } = useAppSelector((s) => s.templates)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const canManageCompany = role === 'super_admin' || role === 'company_admin'
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

  useEffect(() => {
    if (createStatus === 'idle' && createdId) {
      setCreateOpen(false)
      const newId = createdId
      dispatch(templatesActions.clearCreate())
      dispatch(templatesActions.loadListRequested({ force: true }))
      navigate(`/templates/${newId}`)
    }
  }, [createStatus, createdId, dispatch, navigate])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function handleToggleActive(template: SmsTemplate) {
    dispatch(templatesActions.setActiveRequested({ id: template.id, isActive: !template.isActive }))
  }

  function handleDelete(template: SmsTemplate) {
    dispatch(templatesActions.deleteRequested({ id: template.id }))
  }

  function handleCreate(values: CreateTemplateBody) {
    dispatch(templatesActions.createRequested(values))
  }

  const visibleTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize)

  return (
    <FeaturePage
      title="Templates"
      description="Manage platform and company SMS templates. Company templates override platform defaults."
      actions={
        <div className="flex items-center gap-2">
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
          {canManageCompany ? (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              New template
            </Button>
          ) : null}
        </div>
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
              onDelete={handleDelete}
              busyId={togglingId ?? deletingId}
              canDelete={canManageCompany}
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

      <TemplateCreateDialog
        open={createOpen}
        isSaving={createStatus === 'saving'}
        error={createError}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </FeaturePage>
  )
}

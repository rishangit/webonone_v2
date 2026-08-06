import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ListPageBody,
  SearchInput,
  Pagination,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { templatesActions } from '@/features/templates/store'
import type { SmsTemplate } from '@/shared/types/sms.types'
import type { CreateTemplateBody, UpdateTemplateBody } from '@/shared/services/smsApi'
import { TemplatesList } from '../components/TemplatesList'
import { TemplateFormDialog } from '../components/TemplateFormDialog'

type DialogMode = 'create' | 'edit'

export function TemplatesPage() {
  const { t } = useTranslation('templates')

  const dispatch = useAppDispatch()
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
    detailStatus,
    detailError,
  } = useAppSelector((s) => s.templates)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null)
  const [awaitingUpdate, setAwaitingUpdate] = useState(false)

  const canManageCompany = role === 'super_admin' || role === 'company_admin'
  const loading = listStatus === 'loading' && templates.length === 0
  usePlatformLoading(loading ? t('loading') : null)

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
      setDialogOpen(false)
      dispatch(templatesActions.clearCreate())
      dispatch(templatesActions.loadListRequested({ force: true }))
    }
  }, [createStatus, createdId, dispatch])

  useEffect(() => {
    if (!awaitingUpdate) return
    if (detailStatus === 'idle' && !detailError) {
      setAwaitingUpdate(false)
      setDialogOpen(false)
      setEditingTemplate(null)
      dispatch(templatesActions.loadListRequested({ force: true }))
    }
    if (detailStatus === 'error') {
      setAwaitingUpdate(false)
    }
  }, [awaitingUpdate, detailError, detailStatus, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function handleToggleActive(template: SmsTemplate) {
    dispatch(templatesActions.setActiveRequested({ id: template.id, isActive: !template.isActive }))
  }

  function handleDelete(template: SmsTemplate) {
    dispatch(templatesActions.deleteRequested({ id: template.id }))
  }

  function handleOpenCreate() {
    setDialogMode('create')
    setEditingTemplate(null)
    dispatch(templatesActions.clearCreate())
    setDialogOpen(true)
  }

  function handleOpenEdit(template: SmsTemplate) {
    setDialogMode('edit')
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  function handleCreate(values: CreateTemplateBody) {
    dispatch(templatesActions.createRequested(values))
  }

  function handleUpdate(values: UpdateTemplateBody) {
    if (!editingTemplate) return
    setAwaitingUpdate(true)
    dispatch(templatesActions.updateRequested({ id: editingTemplate.id, body: values }))
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditingTemplate(null)
      setAwaitingUpdate(false)
      dispatch(templatesActions.clearCreate())
    }
  }

  const visibleTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize)
  const isSaving =
    dialogMode === 'create' ? createStatus === 'saving' : detailStatus === 'saving'
  const dialogError = dialogMode === 'create' ? createError : awaitingUpdate ? detailError : null

  return (
    <FeaturePage
      title={t('title')}
      description={t('description')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            placeholder={t('search')}
            onClear={() => setPage(1)}
            aria-label={t('searchAria')}
            className="w-64"
          />
          {canManageCompany ? (
            <Button type="button" size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('add')}
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
              onEdit={handleOpenEdit}
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

      <TemplateFormDialog
        open={dialogOpen}
        mode={dialogMode}
        template={editingTemplate}
        isSaving={isSaving}
        error={dialogError}
        onOpenChange={handleDialogOpenChange}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onHostedSaved={() => {
          setEditingTemplate(null)
          setAwaitingUpdate(false)
          dispatch(templatesActions.clearCreate())
          dispatch(templatesActions.loadListRequested({ force: true }))
        }}
      />
    </FeaturePage>
  )
}

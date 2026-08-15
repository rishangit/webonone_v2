import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListAddButton,
  ListPageBody,
  Pagination,
  SearchInput,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { formsActions } from '@/features/forms/store'
import { FormCreateDialog } from '@/features/forms/components/FormCreateDialog'
import { FormsList } from '@/features/forms/components/FormsList'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import type { FormTemplate } from '@/shared/types/design.types'
import type { FormCreateMetaValues } from '@/features/forms/schemas/formSchemas'

export function FormsPage() {
  const { t } = useTranslation('forms')

  const dispatch = useAppDispatch()
  const { goToEdit } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role ?? 'member'
  const companyId = user?.companyId ?? null
  const {
    items,
    total,
    page,
    pageSize,
    listStatus,
    listError,
    detail,
    detailStatus,
    detailError,
  } = useAppSelector((s) => s.forms)

  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [awaitingCreate, setAwaitingCreate] = useState(false)

  const canManage = role === 'super_admin' || role === 'company_admin'
  const hasCompany = Boolean(companyId)
  const loading = hasCompany && listStatus === 'loading' && items.length === 0
  usePlatformLoading(loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken || !hasCompany) return
    dispatch(formsActions.loadListRequested({ page: 1, pageSize: 12, force: true }))
  }, [accessToken, dispatch, hasCompany])

  useEffect(() => {
    if (!awaitingCreate) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingCreate(false)
      setDialogOpen(false)
      toast({ title: t('formCreated') })
      goToEdit(detail.id)
      return
    }
    if (detailStatus === 'error') {
      setAwaitingCreate(false)
    }
  }, [awaitingCreate, detail, detailStatus, goToEdit, t, toast])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (!hasCompany) {
    return (
      <FeaturePage
        title={t('title')}
        description={t('description')}
      >
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  function handleSearch(value: string) {
    setSearchQuery(value)
    dispatch(formsActions.loadListRequested({ page: 1, q: value, force: true }))
  }

  function handleCreate(values: FormCreateMetaValues) {
    setAwaitingCreate(true)
    dispatch(
      formsActions.saveDetailRequested({
        body: {
          name: values.name,
          slug: values.slug,
          definition: { version: 1, fields: [] },
          status: 'draft',
        },
      }),
    )
  }

  function handleOpen(form: FormTemplate) {
    goToEdit(form.id)
  }

  function handleDeleted(id: string) {
    dispatch(formsActions.deleteRequested({ id }))
  }

  return (
    <FeaturePage
      title={t('title')}
      description={t('description')}
      actions={
        <>
          <SearchInput
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-56"
          />
          {canManage ? (
            <ListAddButton onClick={() => setDialogOpen(true)}>{t('add')}</ListAddButton>
          ) : null}
        </>
      }
    >
      <ListPageBody>
        {listError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        ) : null}
        <FormsList
          forms={items}
          onOpen={handleOpen}
          onDeleted={handleDeleted}
          canManage={canManage}
        />
        <Pagination
          className="mt-auto"
          currentPage={page}
          pageSize={pageSize}
          totalCount={total}
          onPageChange={(next) =>
            dispatch(formsActions.loadListRequested({ page: next, force: true }))
          }
          onPageSizeChange={(next) =>
            dispatch(formsActions.loadListRequested({ page: 1, pageSize: next, force: true }))
          }
        />
      </ListPageBody>

      <FormCreateDialog
        open={dialogOpen}
        isSaving={detailStatus === 'saving'}
        error={awaitingCreate ? detailError : null}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        onHostedSaved={() => dispatch(formsActions.loadListRequested({ force: true }))}
      />
    </FeaturePage>
  )
}

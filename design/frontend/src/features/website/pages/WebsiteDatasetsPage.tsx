import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FeaturePage,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListAddButton,
  ListPageBody,
  ListPageFooter,
  SearchInput,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websiteDatasetsActions } from '../store'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteDatasetDialog } from '../components/WebsiteDatasetDialog'
import type { CreateWebsiteDatasetValues } from '../schemas/websiteDatasetSchemas'
import type { WebsiteDataset } from '../types'

export function WebsiteDatasetsPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const [dialog, setDialog] = useState<{ id?: string; initial?: WebsiteDataset | null } | null>(null)
  const [awaitingSave, setAwaitingSave] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const list = useEpicCatalogList((s) => s.websiteDatasets, websiteDatasetsActions)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteDatasets)
  usePlatformLoading(list.loading ? t('loading') : null)

  useEffect(() => {
    if (!awaitingSave) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingSave(false)
      setDialog(null)
      toast({ title: dialog?.id ? t('saved') : t('created') })
      list.load(1, list.pageSize, true)
    }
    if (detailStatus === 'error') setAwaitingSave(false)
  }, [awaitingSave, detail, detailStatus, dialog?.id, list, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('description')}>
        <WebsiteHubTabs section="datasets" />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  function handleSubmit(values: CreateWebsiteDatasetValues) {
    setAwaitingSave(true)
    if (dialog?.id) {
      dispatch(websiteDatasetsActions.saveDetailRequested({ id: dialog.id, body: values }))
      return
    }
    dispatch(websiteDatasetsActions.saveDetailRequested({ body: values }))
  }

  return (
    <FeaturePage title={t('title')} description={t('datasetsDescription')}>
      <WebsiteHubTabs
        section="datasets"
        actions={
          <>
            <SearchInput
              value={list.q}
              onChange={(event) => list.setQ(event.target.value)}
              placeholder={t('searchDatasets')}
              className="w-64"
              aria-label={t('searchDatasets')}
            />
            {canManage ? (
              <ListAddButton onClick={() => setDialog({})} compactLabel={tc('add')}>
                {t('addDataset')}
              </ListAddButton>
            ) : null}
          </>
        }
      />
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {list.items.length === 0 ? (
            <ItemListEmpty>{t('emptyDatasets')}</ItemListEmpty>
          ) : (
            <ItemList>
              {(list.items as WebsiteDataset[]).map((item) => (
                <ItemListItem key={item.id}>
                  <ItemListContent>
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => canManage && setDialog({ id: item.id, initial: item })}
                    >
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`datasetSource.${item.sourceType}`)} · {item.filters?.rules?.length ?? 0}{' '}
                        {t('datasetRules')} · {t(item.status === 'active' ? 'active' : 'inactive')}
                      </p>
                    </button>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <DropdownMenuItem onClick={() => setDialog({ id: item.id, initial: item })}>
                        {t('editDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                      >
                        {t('common:delete')}
                      </DropdownMenuItem>
                    </ItemListMenu>
                  ) : null}
                </ItemListItem>
              ))}
            </ItemList>
          )}
        </div>
        <ListPageFooter
          className="mt-auto"
          currentPage={list.page}
          pageSize={list.pageSize}
          totalCount={list.total}
          loadedCount={list.items.length}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          onPageChange={(next) => list.load(next, list.pageSize, true)}
          onPageSizeChange={(next) => list.load(1, next, true)}
          onLoadMore={() => list.loadMore()}
          onModeChange={() => list.load(1, list.pageSize, true)}
        />
      </ListPageBody>
      <WebsiteDatasetDialog
        open={dialog !== null}
        entityId={dialog?.id}
        initial={dialog?.initial ?? null}
        isSaving={detailStatus === 'saving'}
        error={awaitingSave ? detailError : null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={handleSubmit}
        onHostedSaved={() => list.load(1, list.pageSize, true)}
      />
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? t('deleteConfirm', { name: pendingDelete.name }) : t('deleteConfirmFallback')}
        description={t('deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) {
            dispatch(websiteDatasetsActions.deleteRequested({ id: pendingDelete.id }))
            list.load(list.page, list.pageSize, true)
          }
        }}
      />
    </FeaturePage>
  )
}

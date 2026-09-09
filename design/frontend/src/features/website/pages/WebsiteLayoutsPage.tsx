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
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websiteFootersActions, websiteHeadersActions, websiteLayoutsActions, websiteThemesActions } from '../store'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteLayoutDialog } from '../components/WebsiteLayoutDialog'
import type { LayoutMetaValues } from '../schemas/websiteMeta'
import type { WebsiteLayout } from '../types'

export function WebsiteLayoutsPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const [dialog, setDialog] = useState<{ initial?: LayoutMetaValues; id?: string } | null>(null)
  const [pendingSave, setPendingSave] = useState<'create' | 'edit' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const list = useEpicCatalogList((s) => s.websiteLayouts, websiteLayoutsActions)
  const headers = useAppSelector((s) => s.websiteHeaders.items)
  const footers = useAppSelector((s) => s.websiteFooters.items)
  const themes = useAppSelector((s) => s.websiteThemes.items)
  const { detailStatus, detailError } = useAppSelector((s) => s.websiteLayouts)
  usePlatformLoading(list.loading ? t('loading') : null)

  useEffect(() => {
    if (!pendingSave) return
    if (detailStatus === 'idle') {
      setPendingSave(null)
      setDialog(null)
      toast({ title: pendingSave === 'create' ? t('created') : t('saved') })
    }
    if (detailStatus === 'error') setPendingSave(null)
  }, [detailStatus, pendingSave, t, toast])

  useEffect(() => {
    if (!accessToken) return
    dispatch(websiteHeadersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteFootersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteThemesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [accessToken, dispatch])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('description')}>
        <WebsiteHubTabs section="layouts" />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const editing = dialog?.id
    ? (list.items as WebsiteLayout[]).find((item) => item.id === dialog.id) ?? null
    : null

  return (
    <FeaturePage title={t('title')} description={t('layoutsDescription')}>
      <WebsiteHubTabs
        section="layouts"
        actions={
          <>
            <SearchInput
              value={list.q}
              onChange={(event) => list.setQ(event.target.value)}
              placeholder={t('searchLayouts')}
              className="w-64"
            />
            {canManage ? (
              <ListAddButton onClick={() => setDialog({})} compactLabel={tc('add')}>
                {t('addLayout')}
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
            <ItemListEmpty>{t('emptyLayouts')}</ItemListEmpty>
          ) : (
            <ItemList>
              {(list.items as WebsiteLayout[]).map((item) => (
                <ItemListItem key={item.id}>
                  <ItemListContent>
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() =>
                        canManage
                          ? setDialog({
                              id: item.id,
                              initial: {
                                name: item.name,
                                headerId: item.headerId,
                                footerId: item.footerId,
                                themeId: item.themeId,
                                isDefault: item.isDefault,
                                pageIds: item.pages.map((page) => page.id),
                              },
                            })
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {item.isDefault ? <StatusTag variant="approved">{t('default')}</StatusTag> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('layoutPagesCount', { count: item.pages.length })}
                        {item.themeId
                          ? ` · ${themes.find((theme) => theme.id === item.themeId)?.name ?? t('theme')}`
                          : ''}
                      </p>
                    </button>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <DropdownMenuItem
                        onClick={() =>
                          setDialog({
                            id: item.id,
                            initial: {
                              name: item.name,
                              headerId: item.headerId,
                              footerId: item.footerId,
                              themeId: item.themeId,
                              isDefault: item.isDefault,
                              pageIds: item.pages.map((page) => page.id),
                            },
                          })
                        }
                      >
                        {t('editDetails')}
                      </DropdownMenuItem>
                      {!item.isDefault ? (
                        <DropdownMenuItem
                          onClick={() => {
                            dispatch(websiteLayoutsActions.saveDetailRequested({ id: item.id, body: { isDefault: true } }))
                            list.load(1, list.pageSize, true)
                            toast({ title: t('saved') })
                          }}
                        >
                          {t('setDefault')}
                        </DropdownMenuItem>
                      ) : null}
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
      <WebsiteLayoutDialog
        open={dialog !== null}
        entityId={dialog?.id}
        initial={dialog?.initial}
        assignedPages={editing?.pages ?? []}
        headers={headers}
        footers={footers}
        themes={themes}
        isSaving={detailStatus === 'saving'}
        error={detailError}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={(values) => {
          setPendingSave(dialog?.id ? 'edit' : 'create')
          dispatch(
            websiteLayoutsActions.saveDetailRequested(
              dialog?.id ? { id: dialog.id, body: values } : { body: values },
            ),
          )
        }}
        onHostedSaved={() => list.load(1, list.pageSize, true)}
      />
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? t('deleteConfirm', { name: pendingDelete.name }) : t('deleteConfirmFallback')}
        description={t('deleteLayoutDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) {
            dispatch(websiteLayoutsActions.deleteRequested({ id: pendingDelete.id }))
            list.load(list.page, list.pageSize, true)
          }
        }}
      />
    </FeaturePage>
  )
}

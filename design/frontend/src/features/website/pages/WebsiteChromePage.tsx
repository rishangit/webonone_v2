import { useState } from 'react'
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
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websiteFootersActions, websiteHeadersActions } from '../store'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteChromeDialog } from '../components/WebsiteEntityDialogs'
import type { WebsiteChrome } from '../types'
import type { RootState } from '@/app/store'

export function WebsiteHeadersPage() {
  return <WebsiteChromePage kind="headers" />
}

export function WebsiteFootersPage() {
  return <WebsiteChromePage kind="footers" />
}

export function WebsiteChromePage({ kind }: { kind: 'headers' | 'footers' }) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsiteEdit } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const actions = kind === 'headers' ? websiteHeadersActions : websiteFootersActions
  const select = (s: RootState) => (kind === 'headers' ? s.websiteHeaders : s.websiteFooters)
  const list = useEpicCatalogList(select, actions)
  const detailStatus = useAppSelector((s) => select(s).detailStatus)
  const detailError = useAppSelector((s) => select(s).detailError)
  usePlatformLoading(list.loading ? t('loading') : null)

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('description')}>
        <WebsiteHubTabs section={kind} />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={t('title')}
      description={kind === 'headers' ? t('headersDescription') : t('footersDescription')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder={kind === 'headers' ? t('searchHeaders') : t('searchFooters')}
            className="w-64"
          />
          {canManage ? (
            <ListAddButton onClick={() => setDialogOpen(true)} compactLabel={tc('add')}>
              {kind === 'headers' ? t('addHeader') : t('addFooter')}
            </ListAddButton>
          ) : null}
        </div>
      }
    >
      <WebsiteHubTabs section={kind} />
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {list.items.length === 0 ? (
            <ItemListEmpty>{kind === 'headers' ? t('emptyHeaders') : t('emptyFooters')}</ItemListEmpty>
          ) : (
            <ItemList>
              {(list.items as WebsiteChrome[]).map((item) => (
                <ItemListItem key={item.id}>
                  <ItemListContent>
                    <button type="button" className="w-full text-left" onClick={() => goToWebsiteEdit(kind, item.id)}>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {item.isDefault ? <StatusTag variant="approved">{t('default')}</StatusTag> : null}
                      </div>
                    </button>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <DropdownMenuItem onClick={() => goToWebsiteEdit(kind, item.id)}>
                        {t('openDesigner')}
                      </DropdownMenuItem>
                      {!item.isDefault ? (
                        <DropdownMenuItem
                          onClick={() => {
                            dispatch(actions.saveDetailRequested({ id: item.id, body: { isDefault: true } }))
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
      <WebsiteChromeDialog
        kind={kind}
        open={dialogOpen}
        isSaving={detailStatus === 'saving'}
        error={detailError}
        onOpenChange={setDialogOpen}
        onSubmit={(name, isDefault) => {
          dispatch(actions.saveDetailRequested({ body: { name, isDefault } }))
          setDialogOpen(false)
          toast({ title: t('created') })
          list.load(1, list.pageSize, true)
        }}
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
            dispatch(actions.deleteRequested({ id: pendingDelete.id }))
            list.load(list.page, list.pageSize, true)
          }
        }}
      />
    </FeaturePage>
  )
}

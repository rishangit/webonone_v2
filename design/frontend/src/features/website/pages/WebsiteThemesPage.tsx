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
import { websiteThemesActions } from '../store'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteThemeDialog } from '../components/WebsiteEntityDialogs'
import type { WebsiteTheme } from '../types'

export function WebsiteThemesPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const list = useEpicCatalogList((s) => s.websiteThemes, websiteThemesActions)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  usePlatformLoading(list.loading ? t('loading') : null)

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('description')}>
        <WebsiteHubTabs section="themes" />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={t('title')}
      description={t('themesDescription')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder={t('searchThemes')}
            className="w-64"
          />
          {canManage ? (
            <ListAddButton onClick={() => setDialogOpen(true)} compactLabel={tc('add')}>
              {t('addTheme')}
            </ListAddButton>
          ) : null}
        </div>
      }
    >
      <WebsiteHubTabs section="themes" />
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {list.items.length === 0 ? (
            <ItemListEmpty>{t('emptyThemes')}</ItemListEmpty>
          ) : (
            <ItemList>
              {(list.items as WebsiteTheme[]).map((theme) => (
                <ItemListItem key={theme.id}>
                  <ItemListContent>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => goToWebsite(`/website/themes/${theme.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{theme.name}</p>
                        {theme.isDefault ? <StatusTag variant="approved">{t('default')}</StatusTag> : null}
                        {!theme.isActive ? <StatusTag variant="pending">{t('inactive')}</StatusTag> : null}
                      </div>
                    </button>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: theme.name })}>
                      <DropdownMenuItem onClick={() => goToWebsite(`/website/themes/${theme.id}`)}>
                        {t('common:edit')}
                      </DropdownMenuItem>
                      {!theme.isDefault ? (
                        <DropdownMenuItem
                          onClick={() => {
                            dispatch(
                              websiteThemesActions.saveDetailRequested({
                                id: theme.id,
                                body: { isDefault: true, isActive: true },
                              }),
                            )
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
                        onClick={() => setPendingDelete({ id: theme.id, name: theme.name })}
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
      <WebsiteThemeDialog
        open={dialogOpen}
        isSaving={detailStatus === 'saving'}
        error={detailError}
        onOpenChange={setDialogOpen}
        onSubmit={(name) => {
          dispatch(websiteThemesActions.saveDetailRequested({ body: { name, isActive: true } }))
          setDialogOpen(false)
          toast({ title: t('created') })
          if (detail) goToWebsite(`/website/themes/${detail.id}`)
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
            dispatch(websiteThemesActions.deleteRequested({ id: pendingDelete.id }))
            list.load(list.page, list.pageSize, true)
          }
        }}
      />
    </FeaturePage>
  )
}

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
  ListPageBody,
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websiteThemesActions } from '../store'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteListPageFooter } from '../components/websiteListPageFooter'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteAddItemControl } from '../components/WebsiteAddItemControl'
import { WebsiteThemeDialog } from '../components/WebsiteEntityDialogs'
import type { WebsiteTheme } from '../types'
import { duplicateItemName } from '../utils/duplicateWebsiteItem'
import { useWebsiteLibraryRevert, WebsiteLibrarySourceTag } from '../components/WebsiteLibraryRevert'
import { WebsitePublishStatusTag } from '../components/WebsitePublishStatus'

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
  const [awaitingCreate, setAwaitingCreate] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const revert = useWebsiteLibraryRevert()
  const list = useEpicCatalogList((s) => s.websiteThemes, websiteThemesActions)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  usePlatformLoading(list.loading ? t('loading') : null)

  useEffect(() => {
    if (!awaitingCreate) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingCreate(false)
      setDialogOpen(false)
      toast({ title: t('created') })
      goToWebsite(`/website/themes/${detail.id}`)
    }
    if (detailStatus === 'error') setAwaitingCreate(false)
  }, [awaitingCreate, detail, detailStatus, goToWebsite, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId && user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('themes')} description={t('themesDescription')}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage title={t('themes')} description={t('themesDescription')}>
      <WebsiteHubTabs
        actions={
          <WebsiteHubListToolbar
            searchValue={list.q}
            onSearchChange={list.setQ}
            searchPlaceholder={t('searchThemes')}
            searchAriaLabel={t('searchThemes')}
            canManage={user?.role === 'super_admin'}
            addLabel={t('addTheme')}
            onAdd={() => setDialogOpen(true)}
            compactAddLabel={tc('add')}
            extra={
              user?.role === 'company_admin' ? (
                <WebsiteAddItemControl
                  kind="themes"
                  addLabel={t('addTheme')}
                  compactAddLabel={tc('add')}
                  onCreate={() => setDialogOpen(true)}
                />
              ) : undefined
            }
          />
        }
      />
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {!list.loading ? (
            list.items.length === 0 ? (
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
                        <p className="flex items-center gap-2 font-medium">
                          {theme.name}
                          <WebsitePublishStatusTag status={theme.publishStatus} />
                        </p>
                        {theme.isDefault ? <StatusTag variant="approved">{t('activeTheme')}</StatusTag> : null}
                        <WebsiteLibrarySourceTag sourceLibraryId={theme.sourceLibraryId} />
                        {!theme.isActive ? <StatusTag variant="pending">{t('inactive')}</StatusTag> : null}
                      </div>
                    </button>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: theme.name })}>
                      <DropdownMenuItem
                        onClick={() => {
                          dispatch(
                            websiteThemesActions.saveDetailRequested({
                              body: {
                                name: duplicateItemName(theme.name),
                                pageBackground: theme.pageBackground,
                                bodyTextColor: theme.bodyTextColor,
                                isActive: true,
                                isDefault: false,
                                fonts: theme.fonts,
                                colorPaletteId: theme.colorPaletteId,
                                pageBackgroundPaletteIndex: theme.pageBackgroundPaletteIndex ?? null,
                                surfacePaletteIndex: theme.surfacePaletteIndex ?? null,
                                bodyTextPaletteIndex: theme.bodyTextPaletteIndex ?? null,
                                accent1PaletteIndex: theme.accent1PaletteIndex ?? null,
                                accent2PaletteIndex: theme.accent2PaletteIndex ?? null,
                                pageBackgroundIndex: theme.pageBackgroundIndex,
                                surfaceIndex: theme.surfaceIndex,
                                bodyTextIndex: theme.bodyTextIndex,
                                accent1Index: theme.accent1Index,
                                accent2Index: theme.accent2Index,
                                colorPalettes: theme.colorPalettes,
                                textStyles: theme.textStyles,
                                buttonStyles: theme.buttonStyles,
                              },
                            }),
                          )
                          list.load(1, list.pageSize, true)
                          toast({ title: t('duplicate') })
                        }}
                      >
                        {t('duplicate')}
                      </DropdownMenuItem>
                      {theme.sourceLibraryId ? (
                        <DropdownMenuItem
                          disabled={revert.reverting}
                          onClick={() => revert.ask({ kind: 'themes', id: theme.id, name: theme.name })}
                        >
                          {t('downloadUpdatedFromLibrary')}
                        </DropdownMenuItem>
                      ) : null}
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
                          {t('setActiveTheme')}
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
          )
          ) : null}
        </div>
        <WebsiteListPageFooter list={list} />
      </ListPageBody>
      <WebsiteThemeDialog
        open={dialogOpen}
        isSaving={detailStatus === 'saving'}
        error={detailError}
        onOpenChange={setDialogOpen}
        onSubmit={(name, publishStatus) => {
          setAwaitingCreate(true)
          dispatch(websiteThemesActions.saveDetailRequested({ body: { name, isActive: true, publishStatus } }))
        }}
        onHostedSaved={(themeId) => {
          if (!themeId) {
            list.load(1, list.pageSize, true)
            return
          }
          toast({ title: t('created') })
          goToWebsite(`/website/themes/${themeId}`)
        }}
      />
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? t('deleteConfirm', { name: pendingDelete.name }) : t('deleteConfirmFallback')}
        description={t('deleteThemeDescription')}
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
      {revert.dialog}
    </FeaturePage>
  )
}

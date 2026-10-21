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
import { websiteDesignerUrl } from '@/features/shell/utils/navigateDesign'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websiteFootersActions, websiteHeadersActions, websiteThemesActions } from '../store'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteListPageFooter } from '../components/websiteListPageFooter'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteChromeDialog } from '../components/WebsiteEntityDialogs'
import { defaultWebsiteTheme } from '../document/palette'
import type { WebsiteChrome } from '../types'
import { duplicateItemName } from '../utils/duplicateWebsiteItem'
import type { RootState } from '@/app/store'
import { WebsiteAddItemControl } from '../components/WebsiteAddItemControl'
import { useWebsiteLibraryRevert, WebsiteLibrarySourceTag } from '../components/WebsiteLibraryRevert'

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
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const themes = useAppSelector((s) => s.websiteThemes.items)
  const theme = defaultWebsiteTheme(themes)
  const [dialog, setDialog] = useState<{ id?: string; name?: string; colorPaletteId?: string | null } | null>(null)
  const [awaitingCreate, setAwaitingCreate] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const revert = useWebsiteLibraryRevert()
  const actions = kind === 'headers' ? websiteHeadersActions : websiteFootersActions
  const select = (s: RootState) => (kind === 'headers' ? s.websiteHeaders : s.websiteFooters)
  const list = useEpicCatalogList(select, actions)
  const detailStatus = useAppSelector((s) => select(s).detailStatus)
  const detailError = useAppSelector((s) => select(s).detailError)
  usePlatformLoading(list.loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(websiteThemesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [accessToken, dispatch])

  useEffect(() => {
    if (!awaitingCreate) return
    if (detailStatus === 'idle') {
      setAwaitingCreate(false)
      setDialog(null)
      toast({ title: t('created') })
    }
    if (detailStatus === 'error') setAwaitingCreate(false)
  }, [awaitingCreate, detailStatus, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId && user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('title')} description={t('description')}>
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
    >
      <WebsiteHubTabs
        actions={
          <WebsiteHubListToolbar
            searchValue={list.q}
            onSearchChange={list.setQ}
            searchPlaceholder={kind === 'headers' ? t('searchHeaders') : t('searchFooters')}
            searchAriaLabel={kind === 'headers' ? t('searchHeaders') : t('searchFooters')}
            canManage={user?.role === 'super_admin'}
            addLabel={kind === 'headers' ? t('addHeader') : t('addFooter')}
            onAdd={() => setDialog({})}
            compactAddLabel={tc('add')}
            extra={
              user?.role === 'company_admin' ? (
                <WebsiteAddItemControl
                  kind={kind}
                  addLabel={kind === 'headers' ? t('addHeader') : t('addFooter')}
                  compactAddLabel={tc('add')}
                  onCreate={() => setDialog({})}
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
            <ItemListEmpty>{kind === 'headers' ? t('emptyHeaders') : t('emptyFooters')}</ItemListEmpty>
          ) : (
            <ItemList>
              {(list.items as WebsiteChrome[]).map((item) => (
                <ItemListItem key={item.id}>
                  <ItemListContent>
                    <a
                      href={websiteDesignerUrl(kind, item.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {item.isDefault ? <StatusTag variant="approved">{t('default')}</StatusTag> : null}
                        <WebsiteLibrarySourceTag sourceLibraryId={item.sourceLibraryId} />
                      </div>
                    </a>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <DropdownMenuItem asChild>
                        <a href={websiteDesignerUrl(kind, item.id)} target="_blank" rel="noopener noreferrer">
                          {t('openDesigner')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          dispatch(
                            actions.saveDetailRequested({
                              body: {
                                name: duplicateItemName(item.name),
                                isDefault: false,
                                colorPaletteId: item.colorPaletteId,
                                document: item.document,
                              },
                            }),
                          )
                          list.load(1, list.pageSize, true)
                          toast({ title: t('duplicate') })
                        }}
                      >
                        {t('duplicate')}
                      </DropdownMenuItem>
                      {item.sourceLibraryId ? (
                        <DropdownMenuItem
                          disabled={revert.reverting}
                          onClick={() => revert.ask({ kind, id: item.id, name: item.name })}
                        >
                          {t('downloadUpdatedFromLibrary')}
                        </DropdownMenuItem>
                      ) : null}
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
                      <DropdownMenuItem
                        onClick={() =>
                          setDialog({ id: item.id, name: item.name, colorPaletteId: item.colorPaletteId })
                        }
                      >
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
          )
          ) : null}
        </div>
        <WebsiteListPageFooter list={list} />
      </ListPageBody>
      <WebsiteChromeDialog
        kind={kind}
        open={dialog !== null}
        entityId={dialog?.id}
        initialName={dialog?.name}
        initialColorPaletteId={dialog?.colorPaletteId}
        theme={theme}
        isSaving={detailStatus === 'saving'}
        error={dialog?.id ? null : detailError}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={(name, isDefault, colorPaletteId) => {
          if (dialog?.id) {
            dispatch(actions.saveDetailRequested({ id: dialog.id, body: { name, colorPaletteId } }))
            setDialog(null)
            toast({ title: t('saved') })
            list.load(1, list.pageSize, true)
            return
          }
          setAwaitingCreate(true)
          dispatch(actions.saveDetailRequested({ body: { name, isDefault, colorPaletteId } }))
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
      {revert.dialog}
    </FeaturePage>
  )
}

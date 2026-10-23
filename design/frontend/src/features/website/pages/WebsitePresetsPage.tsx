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
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateDesign, websiteDesignerUrl } from '@/features/shell/utils/navigateDesign'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websitePresetsActions, websiteThemesActions } from '../store'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteListPageFooter } from '../components/websiteListPageFooter'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsitePresetDialog } from '../components/WebsiteEntityDialogs'
import { defaultWebsiteTheme } from '../document/palette'
import type { WebsitePreset } from '../types'
import { duplicateItemName } from '../utils/duplicateWebsiteItem'
import { WebsiteAddItemControl } from '../components/WebsiteAddItemControl'
import { useWebsiteLibraryRevert, WebsiteLibrarySourceTag } from '../components/WebsiteLibraryRevert'
import { WebsitePublishStatusTag } from '../components/WebsitePublishStatus'

export function WebsitePresetsPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsiteEdit } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const [dialog, setDialog] = useState<{
    initialName?: string
    id?: string
    colorPaletteId?: string | null
    publishStatus?: 'draft' | 'published'
  } | null>(null)
  const [awaitingCreate, setAwaitingCreate] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const revert = useWebsiteLibraryRevert()
  const list = useEpicCatalogList((s) => s.websitePresets, websitePresetsActions)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websitePresets)
  const themes = useAppSelector((s) => s.websiteThemes.items)
  const theme = defaultWebsiteTheme(themes)
  usePlatformLoading(list.loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(websiteThemesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [accessToken, dispatch])

  useEffect(() => {
    if (!awaitingCreate) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingCreate(false)
      setDialog(null)
      toast({ title: t('created') })
      goToWebsiteEdit('presets', detail.id)
    }
    if (detailStatus === 'error') setAwaitingCreate(false)
  }, [awaitingCreate, detail, detailStatus, goToWebsiteEdit, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId && user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('presets')} description={t('presetsDescription')}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  function handleSubmit(name: string, colorPaletteId: string | null, publishStatus?: 'draft' | 'published') {
    if (dialog?.id) {
      dispatch(websitePresetsActions.saveDetailRequested({ id: dialog.id, body: { name, colorPaletteId, publishStatus } }))
      setDialog(null)
      toast({ title: t('saved') })
      list.load(1, list.pageSize, true)
      return
    }
    setAwaitingCreate(true)
    dispatch(websitePresetsActions.saveDetailRequested({ body: { name, colorPaletteId, publishStatus } }))
  }

  return (
    <FeaturePage title={t('presets')} description={t('presetsDescription')}>
      <WebsiteHubTabs
        actions={
          <WebsiteHubListToolbar
            searchValue={list.q}
            onSearchChange={list.setQ}
            searchPlaceholder={t('searchPresets')}
            searchAriaLabel={t('searchPresets')}
            canManage={user?.role === 'super_admin'}
            addLabel={t('addPreset')}
            onAdd={() => setDialog({})}
            compactAddLabel={tc('add')}
            extra={
              user?.role === 'company_admin' ? (
                <WebsiteAddItemControl
                  kind="presets"
                  addLabel={t('addPreset')}
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
            <ItemListEmpty>{t('emptyPresets')}</ItemListEmpty>
          ) : (
            <ItemList>
              {(list.items as WebsitePreset[]).map((item) => (
                <ItemListItem key={item.id}>
                  <ItemListContent>
                    <a
                      href={websiteDesignerUrl('presets', item.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-left"
                    >
                      <p className="font-medium">{item.name}</p>
                      <WebsiteLibrarySourceTag sourceLibraryId={item.sourceLibraryId} />
                      <WebsitePublishStatusTag status={item.publishStatus} />
                    </a>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <DropdownMenuItem asChild>
                        <a href={websiteDesignerUrl('presets', item.id)} target="_blank" rel="noopener noreferrer">
                          {t('openDesigner')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          dispatch(
                            websitePresetsActions.saveDetailRequested({
                              body: { name: duplicateItemName(item.name), colorPaletteId: item.colorPaletteId, document: item.document },
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
                          onClick={() => revert.ask({ kind: 'presets', id: item.id, name: item.name })}
                        >
                          {t('downloadUpdatedFromLibrary')}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onClick={() =>
                          setDialog({
                            id: item.id,
                            initialName: item.name,
                            colorPaletteId: item.colorPaletteId,
                            publishStatus: item.publishStatus,
                          })
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
      <WebsitePresetDialog
        open={dialog !== null}
        entityId={dialog?.id}
        initialName={dialog?.initialName}
        initialColorPaletteId={dialog?.colorPaletteId}
        initialPublishStatus={dialog?.publishStatus ?? 'draft'}
        theme={theme}
        isSaving={detailStatus === 'saving'}
        error={awaitingCreate ? detailError : null}
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
            dispatch(websitePresetsActions.deleteRequested({ id: pendingDelete.id }))
            list.load(list.page, list.pageSize, true)
          }
        }}
      />
      {revert.dialog}
    </FeaturePage>
  )
}

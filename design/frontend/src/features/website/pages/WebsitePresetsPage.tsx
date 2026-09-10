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
import { useNavigateDesign, websiteDesignerUrl } from '@/features/shell/utils/navigateDesign'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'
import { websitePresetsActions } from '../store'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsitePresetDialog } from '../components/WebsiteEntityDialogs'
import type { WebsitePreset } from '../types'

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
  const [dialog, setDialog] = useState<{ initialName?: string; id?: string } | null>(null)
  const [awaitingCreate, setAwaitingCreate] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const list = useEpicCatalogList((s) => s.websitePresets, websitePresetsActions)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websitePresets)
  usePlatformLoading(list.loading ? t('loading') : null)

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
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('description')}>
        <WebsiteHubTabs section="presets" />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  function handleSubmit(name: string) {
    if (dialog?.id) {
      dispatch(websitePresetsActions.saveDetailRequested({ id: dialog.id, body: { name } }))
      setDialog(null)
      toast({ title: t('saved') })
      list.load(1, list.pageSize, true)
      return
    }
    setAwaitingCreate(true)
    dispatch(websitePresetsActions.saveDetailRequested({ body: { name } }))
  }

  return (
    <FeaturePage title={t('title')} description={t('presetsDescription')}>
      <WebsiteHubTabs
        section="presets"
        actions={
          <>
            <SearchInput
              value={list.q}
              onChange={(event) => list.setQ(event.target.value)}
              placeholder={t('searchPresets')}
              className="w-64"
              aria-label={t('searchPresets')}
            />
            {canManage ? (
              <ListAddButton onClick={() => setDialog({})} compactLabel={tc('add')}>
                {t('addPreset')}
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
                    </a>
                  </ItemListContent>
                  {canManage ? (
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <DropdownMenuItem asChild>
                        <a href={websiteDesignerUrl('presets', item.id)} target="_blank" rel="noopener noreferrer">
                          {t('openDesigner')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDialog({ id: item.id, initialName: item.name })}>
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
      <WebsitePresetDialog
        open={dialog !== null}
        entityId={dialog?.id}
        initialName={dialog?.initialName}
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
    </FeaturePage>
  )
}

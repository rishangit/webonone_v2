import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FeaturePage,
  ItemList,
  ItemListEmpty,
  ItemListMenu,
  ListPageBody,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { ColorLibraryAddDialog } from '../components/ColorLibraryAddDialog'
import { ColorPaletteHubListItem } from '../components/ColorPaletteHubListItem'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteListPageFooter } from '../components/websiteListPageFooter'
import { websiteColorLibraryActions, websiteColorLibraryDeleteActions } from '../store'
import type { WebsiteColorLibraryItem } from '../types'

export function WebsiteColorLibraryPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const library = useAppSelector((s) => s.websiteColorLibrary)
  const deleteState = useAppSelector((s) => s.websiteColorLibraryDelete)
  const [searchQuery, setSearchQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<WebsiteColorLibraryItem | null>(null)

  const initialLoading = library.listStatus === 'loading' && library.items.length === 0
  usePlatformLoading(initialLoading ? t('loadingColorLibrary') : null)

  const listController = useMemo(
    () => ({
      page: library.page,
      pageSize: library.pageSize,
      total: library.total,
      items: library.items,
      hasMore: library.items.length < library.total,
      loadingMore: library.listStatus === 'loading' && library.items.length > 0,
      load: (page: number, pageSize: number, force = false) => {
        dispatch(
          websiteColorLibraryActions.loadListRequested({
            page,
            pageSize,
            force,
            extra: { q: searchQuery.trim() || undefined },
          }),
        )
      },
      loadMore: () => {
        if (library.listStatus === 'loading' || library.items.length >= library.total) return
        dispatch(
          websiteColorLibraryActions.loadListRequested({
            page: library.page + 1,
            pageSize: library.pageSize,
            append: true,
            extra: { q: searchQuery.trim() || undefined },
          }),
        )
      },
    }),
    [dispatch, library.items, library.listStatus, library.page, library.pageSize, library.total, searchQuery],
  )

  useEffect(() => {
    const handle = window.setTimeout(() => {
      dispatch(
        websiteColorLibraryActions.loadListRequested({
          page: 1,
          pageSize: library.pageSize,
          force: true,
          extra: { q: searchQuery.trim() || undefined },
        }),
      )
    }, 300)
    return () => window.clearTimeout(handle)
  }, [dispatch, library.pageSize, searchQuery])

  useEffect(() => {
    if (deleteState.status === 'error' && deleteState.error) {
      toast({
        title: t('colorLibraryDeleteFailed'),
        description: deleteState.error,
        variant: 'destructive',
      })
      dispatch(websiteColorLibraryDeleteActions.deleteReset())
    }
  }, [deleteState.error, deleteState.status, dispatch, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('colorLibraryPageTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('colorLibrarySuperAdminOnly')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage title={t('colorLibraryPageTitle')} description={t('colorLibraryPageDescription')}>
      <WebsiteHubTabs
        actions={
          <WebsiteHubListToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('searchColorLibrary')}
            searchAriaLabel={t('searchColorLibrary')}
            canManage
            addLabel={t('addColorPaletteToLibrary')}
            onAdd={() => setAddOpen(true)}
            compactAddLabel={tc('add')}
          />
        }
      />
      {library.listStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{library.listError ?? t('colorLibraryLoadFailed')}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {library.items.length === 0 && library.listStatus !== 'loading' ? (
            <ItemListEmpty>{t('colorLibraryEmptySuperAdmin')}</ItemListEmpty>
          ) : (
            <ItemList>
              {library.items.map((paletteItem) => {
                const deleting = deleteState.pendingId === paletteItem.id
                return (
                  <ColorPaletteHubListItem
                    key={paletteItem.id}
                    name={paletteItem.name}
                    palette={paletteItem.palette}
                    colorCountLabel={t('colorPaletteColorCount', { count: paletteItem.palette.colors.length })}
                    publishStatus={paletteItem.publishStatus}
                    onOpen={() => goToWebsite(`/website/colors/${paletteItem.id}`)}
                    menu={
                      <ItemListMenu ariaLabel={t('actionsFor', { name: paletteItem.name })}>
                        <DropdownMenuItem
                          disabled={deleting}
                          onClick={() => goToWebsite(`/website/colors/${paletteItem.id}`)}
                        >
                          {tc('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={deleting}
                          onClick={() => setPendingDelete(paletteItem)}
                        >
                          {tc('delete')}
                        </DropdownMenuItem>
                      </ItemListMenu>
                    }
                  />
                )
              })}
            </ItemList>
          )}
        </div>
        <WebsiteListPageFooter list={listController} />
      </ListPageBody>
      <ColorLibraryAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() =>
          dispatch(
            websiteColorLibraryActions.loadListRequested({
              page: 1,
              pageSize: library.pageSize,
              force: true,
              extra: { q: searchQuery.trim() || undefined },
            }),
          )
        }
      />
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={t('deleteColorLibraryTitle')}
        description={
          pendingDelete
            ? t('deleteColorLibraryDescription', { name: pendingDelete.name })
            : t('deleteColorLibraryTitle')
        }
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete) return
          dispatch(websiteColorLibraryDeleteActions.deleteRequested(pendingDelete.id))
          setPendingDelete(null)
          toast({ title: t('colorLibraryDeleted') })
        }}
      />
    </FeaturePage>
  )
}

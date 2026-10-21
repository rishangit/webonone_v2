import { useEffect, useMemo, useState } from 'react'
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
  itemListRowBodyClassName,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { ButtonLibraryAddDialog } from '../components/ButtonLibraryAddDialog'
import { WebsitePublishStatusTag } from '../components/WebsitePublishStatus'
import { CopyToAiMenuItem } from '../components/CopyToAiMenuItem'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteListPageFooter } from '../components/websiteListPageFooter'
import { buttonLabelTypography } from '../document/theme'
import { websiteButtonLibraryActions, websiteButtonLibraryDeleteActions } from '../store'
import type { WebsiteButtonLibraryItem } from '../types'

export function WebsiteButtonLibraryPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const library = useAppSelector((s) => s.websiteButtonLibrary)
  const deleteState = useAppSelector((s) => s.websiteButtonLibraryDelete)
  const [searchQuery, setSearchQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<WebsiteButtonLibraryItem | null>(null)

  const initialLoading = library.listStatus === 'loading' && library.items.length === 0
  usePlatformLoading(initialLoading ? t('loadingButtonLibrary') : null)

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
          websiteButtonLibraryActions.loadListRequested({
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
          websiteButtonLibraryActions.loadListRequested({
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
        websiteButtonLibraryActions.loadListRequested({
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
        title: t('buttonLibraryDeleteFailed'),
        description: deleteState.error,
        variant: 'destructive',
      })
      dispatch(websiteButtonLibraryDeleteActions.deleteReset())
    }
  }, [deleteState.error, deleteState.status, dispatch, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('buttonLibraryPageTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('buttonLibrarySuperAdminOnly')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage title={t('buttonLibraryPageTitle')} description={t('buttonLibraryPageDescription')}>
      <WebsiteHubTabs
        actions={
          <WebsiteHubListToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('searchButtonLibrary')}
            searchAriaLabel={t('searchButtonLibrary')}
            canManage
            addLabel={t('addButtonToLibrary')}
            onAdd={() => setAddOpen(true)}
            compactAddLabel={tc('add')}
          />
        }
      />
      {library.listStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{library.listError ?? t('buttonLibraryLoadFailed')}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {library.items.length === 0 && library.listStatus !== 'loading' ? (
            <ItemListEmpty>{t('buttonLibraryEmptySuperAdmin')}</ItemListEmpty>
          ) : (
            <ItemList>
              {library.items.map((item) => {
                const deleting = deleteState.pendingId === item.id
                const d = item.definition
                return (
                  <ItemListItem key={item.id}>
                    <ItemListContent>
                      <button
                        type="button"
                        className={`${itemListRowBodyClassName} rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                        onClick={() => goToWebsite(`/website/buttons/${item.id}`)}
                      >
                        <span
                          className="inline-flex shrink-0 items-center justify-center self-start px-3 py-1 text-sm"
                          style={{
                            ...buttonLabelTypography(),
                            backgroundColor: d.backgroundColorValue,
                            color: d.textColorValue,
                            border: `${d.borderWidth}px solid ${d.borderColorValue}`,
                            borderRadius: d.radius,
                            fontFamily: d.textFontFamily,
                            fontSize: d.textSize,
                          }}
                        >
                          {item.name || t('buttonPreviewLabel')}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            {item.name}
                            <WebsitePublishStatusTag status={item.publishStatus} />
                          </p>
                          <p className="truncate text-sm text-muted-foreground">{d.textFontName}</p>
                        </div>
                      </button>
                    </ItemListContent>
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <CopyToAiMenuItem kind="button" id={item.id} label={item.name} />
                      <DropdownMenuItem disabled={deleting} onClick={() => goToWebsite(`/website/buttons/${item.id}`)}>
                        {tc('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={deleting}
                        onClick={() => setPendingDelete(item)}
                      >
                        {tc('delete')}
                      </DropdownMenuItem>
                    </ItemListMenu>
                  </ItemListItem>
                )
              })}
            </ItemList>
          )}
        </div>
        <WebsiteListPageFooter list={listController} />
      </ListPageBody>
      <ButtonLibraryAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() =>
          dispatch(
            websiteButtonLibraryActions.loadListRequested({
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
        title={t('deleteButtonLibraryTitle')}
        description={
          pendingDelete
            ? t('deleteButtonLibraryDescription', { name: pendingDelete.name })
            : t('deleteButtonLibraryTitle')
        }
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete) return
          dispatch(websiteButtonLibraryDeleteActions.deleteRequested(pendingDelete.id))
          setPendingDelete(null)
          toast({ title: t('buttonLibraryDeleted') })
        }}
      />
    </FeaturePage>
  )
}

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
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { CopyToAiMenuItem } from '../components/CopyToAiMenuItem'
import { TextLibraryAddDialog } from '../components/TextLibraryAddDialog'
import { WebsitePublishStatusTag } from '../components/WebsitePublishStatus'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteListPageFooter } from '../components/websiteListPageFooter'
import { websiteTextLibraryActions, websiteTextLibraryDeleteActions } from '../store'
import type { WebsiteTextLibraryItem } from '../types'
import { themeFontFamilyStyle } from '../utils/themeFontPreview'

export function WebsiteTextLibraryPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const library = useAppSelector((s) => s.websiteTextLibrary)
  const deleteState = useAppSelector((s) => s.websiteTextLibraryDelete)
  const [searchQuery, setSearchQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<WebsiteTextLibraryItem | null>(null)

  const initialLoading = library.listStatus === 'loading' && library.items.length === 0
  usePlatformLoading(initialLoading ? t('loadingTextLibrary') : null)

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
          websiteTextLibraryActions.loadListRequested({
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
          websiteTextLibraryActions.loadListRequested({
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
        websiteTextLibraryActions.loadListRequested({
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
        title: t('textLibraryDeleteFailed'),
        description: deleteState.error,
        variant: 'destructive',
      })
      dispatch(websiteTextLibraryDeleteActions.deleteReset())
    }
  }, [deleteState.error, deleteState.status, dispatch, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('textLibraryPageTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('textLibrarySuperAdminOnly')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage title={t('textLibraryPageTitle')} description={t('textLibraryPageDescription')}>
      <WebsiteHubTabs
        actions={
          <WebsiteHubListToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('searchTextLibrary')}
            searchAriaLabel={t('searchTextLibrary')}
            canManage
            addLabel={t('addTextToLibrary')}
            onAdd={() => setAddOpen(true)}
            compactAddLabel={tc('add')}
          />
        }
      />
      {library.listStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{library.listError ?? t('textLibraryLoadFailed')}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {library.items.length === 0 && library.listStatus !== 'loading' ? (
            <ItemListEmpty>{t('textLibraryEmptySuperAdmin')}</ItemListEmpty>
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
                        className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => goToWebsite(`/website/texts/${item.id}`)}
                      >
                        <p className="flex items-center gap-2 font-medium">
                          {item.name}
                          <WebsitePublishStatusTag status={item.publishStatus} />
                        </p>
                        <p
                          className="truncate text-sm text-muted-foreground"
                          style={themeFontFamilyStyle(d.family)}
                        >
                          {d.fontName} · {d.size}px · {d.colorName}
                        </p>
                      </button>
                    </ItemListContent>
                    <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                      <CopyToAiMenuItem kind="text" id={item.id} label={item.name} />
                      <DropdownMenuItem disabled={deleting} onClick={() => goToWebsite(`/website/texts/${item.id}`)}>
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
      <TextLibraryAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() =>
          dispatch(
            websiteTextLibraryActions.loadListRequested({
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
        title={t('deleteTextLibraryTitle')}
        description={
          pendingDelete
            ? t('deleteTextLibraryDescription', { name: pendingDelete.name })
            : t('deleteTextLibraryTitle')
        }
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete) return
          dispatch(websiteTextLibraryDeleteActions.deleteRequested(pendingDelete.id))
          setPendingDelete(null)
          toast({ title: t('textLibraryDeleted') })
        }}
      />
    </FeaturePage>
  )
}

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
import { FontLibraryAddDialog } from '../components/FontLibraryAddDialog'
import { WebsitePublishStatusTag } from '../components/WebsitePublishStatus'
import { WebsiteHubListToolbar } from '../components/WebsiteHubListToolbar'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import { WebsiteListPageFooter } from '../components/websiteListPageFooter'
import {
  websiteFontLibraryActions,
  websiteFontLibraryDeleteActions,
} from '../store'
import type { WebsiteFontLibraryItem } from '../types'
import { themeFontFamilyStyle } from '../utils/themeFontPreview'

export function WebsiteFontLibraryPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const library = useAppSelector((s) => s.websiteFontLibrary)
  const deleteState = useAppSelector((s) => s.websiteFontLibraryDelete)
  const [searchQuery, setSearchQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WebsiteFontLibraryItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebsiteFontLibraryItem | null>(null)

  const initialLoading = library.listStatus === 'loading' && library.items.length === 0
  usePlatformLoading(initialLoading ? t('loadingFontLibrary') : null)

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
          websiteFontLibraryActions.loadListRequested({
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
          websiteFontLibraryActions.loadListRequested({
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
        websiteFontLibraryActions.loadListRequested({
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
        title: t('fontLibraryDeleteFailed'),
        description: deleteState.error,
        variant: 'destructive',
      })
      dispatch(websiteFontLibraryDeleteActions.deleteReset())
    }
  }, [deleteState.error, deleteState.status, dispatch, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') {
    return (
      <FeaturePage title={t('fontLibraryPageTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('fontLibrarySuperAdminOnly')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const fontUrls = library.items.map((font) => font.googleFontUrl).filter(Boolean)

  return (
    <FeaturePage title={t('fontLibraryPageTitle')} description={t('fontLibraryPageDescription')}>
      <WebsiteHubTabs
        actions={
          <WebsiteHubListToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('searchFontLibrary')}
            searchAriaLabel={t('searchFontLibrary')}
            canManage
            addLabel={t('addFontToLibrary')}
            onAdd={() => setAddOpen(true)}
            compactAddLabel={tc('add')}
          />
        }
      />
      {library.listStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{library.listError ?? t('fontLibraryLoadFailed')}</AlertDescription>
        </Alert>
      ) : null}
      <ListPageBody>
        <div className="flex-1">
          {fontUrls.map((url) => (
            <link key={url} rel="stylesheet" href={url} />
          ))}
          {library.items.length === 0 && library.listStatus !== 'loading' ? (
            <ItemListEmpty>{t('fontLibraryEmptySuperAdmin')}</ItemListEmpty>
          ) : (
            <ItemList>
              {library.items.map((font) => {
                const previewStyle = themeFontFamilyStyle(font.family)
                const deleting = deleteState.pendingId === font.id
                return (
                  <ItemListItem key={font.id}>
                    <ItemListContent>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[hsl(var(--glass-border))] bg-background text-lg leading-none"
                          style={previewStyle}
                          aria-hidden
                        >
                          Aa
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            {font.name}
                            <WebsitePublishStatusTag status={font.publishStatus} />
                          </p>
                          <p className="truncate text-base leading-snug text-muted-foreground" style={previewStyle}>
                            {t('textPreviewSample')}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{font.family}</p>
                        </div>
                      </div>
                    </ItemListContent>
                    <ItemListMenu ariaLabel={t('actionsFor', { name: font.name })}>
                      <DropdownMenuItem disabled={deleting} onClick={() => setEditingItem(font)}>
                        {tc('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={deleting}
                        onClick={() => setPendingDelete(font)}
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
      <FontLibraryAddDialog open={addOpen} onOpenChange={setAddOpen} />
      <FontLibraryAddDialog
        open={editingItem !== null}
        item={editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null)
        }}
      />
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={t('deleteFontLibraryTitle')}
        description={
          pendingDelete
            ? t('deleteFontLibraryDescription', { name: pendingDelete.name })
            : t('deleteFontLibraryTitle')
        }
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete) return
          dispatch(websiteFontLibraryDeleteActions.deleteRequested(pendingDelete.id))
          setPendingDelete(null)
          toast({ title: t('fontLibraryDeleted') })
        }}
      />
    </FeaturePage>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { FeaturePage, ListAddButton, ListPageBody, ListPageFooter, SearchInput, useClientListPage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { ThemeFormDialog } from '../components/ThemeFormDialog'
import { ThemeList } from '../components/ThemeList'
import type { ApiTheme } from '../services/themeApi'
import { isFresh } from '@/shared/store/cacheUtils'
import { systemThemeActions } from '../store/systemThemeSlice'

type DialogState = { id?: string } | null

export function SystemThemePage() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { themes, preferences, status, error, themesFetchedAt, preferencesFetchedAt } =
    useAppSelector((s) => s.systemTheme)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiTheme | null>(null)
  const [themeSearchQuery, setThemeSearchQuery] = useState('')

  const filteredThemes = useMemo(() => {
    const query = themeSearchQuery.trim().toLowerCase()
    if (!query) return themes
    return themes.filter((theme) => theme.name.toLowerCase().includes(query))
  }, [themes, themeSearchQuery])

  const loading = status === 'loading'

  usePlatformLoading(loading ? t('systemTheme.list.loading') : null)

  useEffect(() => {
    if (!isFresh(themesFetchedAt)) {
      dispatch(systemThemeActions.loadThemesRequested())
    }
    if (!isFresh(preferencesFetchedAt)) {
      dispatch(systemThemeActions.loadPreferencesRequested())
    }
  }, [dispatch, themesFetchedAt, preferencesFetchedAt])

  useEffect(() => {
    if (deleteTarget) {
      dispatch(systemThemeActions.clearError())
    }
  }, [deleteTarget, dispatch])

  const themeList = useClientListPage(filteredThemes)
  const visibleThemes = themeList.visible
  const emptyMessage = themeSearchQuery.trim() ? t('systemTheme.list.emptySearch') : t('systemTheme.list.empty')

  return (
    <FeaturePage
      title={t('systemTheme.list.title')}
      description={t('systemTheme.list.description')}
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            value={themeSearchQuery}
            onChange={(event) => {
              setThemeSearchQuery(event.target.value)
            }}
            placeholder={t('systemTheme.list.searchPlaceholder')}
            aria-label={t('systemTheme.list.searchAria')}
            className="w-64"
          />
          <ListAddButton onClick={() => setDialog({})}>{t('systemTheme.list.createTheme')}</ListAddButton>
        </div>
      }
    >
      {!dialog && !deleteTarget && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!loading ? (
            <ThemeList
              themes={visibleThemes}
              activeThemeId={preferences?.activeThemeId ?? null}
              emptyMessage={emptyMessage}
              onOpen={(id) => navigate(`/settings/system-theme/${id}`)}
              onApply={(id) =>
                dispatch(systemThemeActions.patchPreferencesRequested({ activeThemeId: id }))
              }
              onEdit={(theme) => setDialog({ id: theme.id })}
              onDelete={(id) => {
                const theme = themes.find((item) => item.id === id)
                if (theme) setDeleteTarget(theme)
              }}
            />
          ) : null}
        </div>
        <ListPageFooter
          className="mt-auto"
          totalCount={themeList.total}
          currentPage={themeList.page}
          pageSize={themeList.pageSize}
          pageSizeOptions={[12, 24, 48]}
          loadedCount={themeList.loadedCount}
          hasMore={themeList.hasMore}
          onPageChange={themeList.setPage}
          onPageSizeChange={themeList.setPageSize}
          onLoadMore={themeList.loadMore}
        />
      </ListPageBody>

      {dialog ? (
        <ThemeFormDialog
          open
          id={dialog.id}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => {
            dispatch(systemThemeActions.loadThemesRequested({ force: true }))
            setDialog(null)
          }}
        />
      ) : null}

      <PlatformAlertConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget ? t('systemTheme.list.deleteTitleNamed', { name: deleteTarget.name }) : t('systemTheme.list.deleteTitle')
        }
        description={t('systemTheme.list.deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (!deleteTarget) return
          dispatch(systemThemeActions.deleteThemeRequested(deleteTarget.id))
          setDeleteTarget(null)
        }}
      />
    </FeaturePage>
  )
}

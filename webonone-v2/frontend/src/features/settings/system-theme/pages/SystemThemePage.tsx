import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { Button, FeaturePage, ListPageBody, SearchInput, Pagination } from '@webonone/ui-kit'
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
  const [themePage, setThemePage] = useState(1)
  const [themePageSize, setThemePageSize] = useState(12)
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

  const visibleThemes = filteredThemes.slice((themePage - 1) * themePageSize, themePage * themePageSize)
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
              setThemePage(1)
            }}
            placeholder={t('systemTheme.list.searchPlaceholder')}
            onClear={() => setThemePage(1)}
            aria-label={t('systemTheme.list.searchAria')}
            className="w-64"
          />
          <Button type="button" size="sm" onClick={() => setDialog({})}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('systemTheme.list.createTheme')}
          </Button>
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
        <Pagination
          className="mt-auto"
          totalCount={filteredThemes.length}
          currentPage={themePage}
          pageSize={themePageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={setThemePage}
          onPageSizeChange={(nextSize) => {
            setThemePageSize(nextSize)
            setThemePage(1)
          }}
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

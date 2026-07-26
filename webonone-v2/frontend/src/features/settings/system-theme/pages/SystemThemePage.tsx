import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button, FeaturePage, ListPageBody, SearchInput, Pagination } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { ThemeDeleteDialog } from '../components/ThemeDeleteDialog'
import { ThemeFormDialog } from '../components/ThemeFormDialog'
import { ThemeList } from '../components/ThemeList'
import type { ApiTheme } from '../services/themeApi'
import { isFresh } from '@/shared/store/cacheUtils'
import { systemThemeActions } from '../store/systemThemeSlice'

type PendingDelete = boolean
type DialogState = { id?: string } | null

export function SystemThemePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { themes, preferences, status, error, themesFetchedAt, preferencesFetchedAt } =
    useAppSelector((s) => s.systemTheme)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiTheme | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(false)
  const [themePage, setThemePage] = useState(1)
  const [themePageSize, setThemePageSize] = useState(12)
  const [themeSearchQuery, setThemeSearchQuery] = useState('')

  const filteredThemes = useMemo(() => {
    const query = themeSearchQuery.trim().toLowerCase()
    if (!query) return themes
    return themes.filter((theme) => theme.name.toLowerCase().includes(query))
  }, [themes, themeSearchQuery])

  const isDeleting = status === 'saving' && pendingDelete
  const loading = status === 'loading'

  usePlatformLoading(loading ? 'Loading themes…' : null)

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

  useEffect(() => {
    if (!pendingDelete) return

    if (status === 'idle') {
      setDeleteTarget(null)
      setPendingDelete(false)
    } else if (status === 'error') {
      // Keep dialog open so the user can retry or cancel.
    }
  }, [status, pendingDelete])

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    setPendingDelete(true)
    dispatch(systemThemeActions.deleteThemeRequested(deleteTarget.id))
  }

  const visibleThemes = filteredThemes.slice((themePage - 1) * themePageSize, themePage * themePageSize)
  const emptyMessage = themeSearchQuery.trim()
    ? 'No themes match your search.'
    : 'No themes yet.'

  return (
    <FeaturePage
      title="System Theme"
      description="Create accent palettes for the platform shell. Change light or dark appearance in Basic Settings."
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            value={themeSearchQuery}
            onChange={(event) => {
              setThemeSearchQuery(event.target.value)
              setThemePage(1)
            }}
            placeholder="Theme name"
            onClear={() => setThemePage(1)}
            aria-label="Search themes"
            className="w-64"
          />
          <Button type="button" size="sm" onClick={() => setDialog({})}>
            <Plus className="h-4 w-4" aria-hidden />
            Create theme
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
                const theme = themes.find((t) => t.id === id)
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

      <ThemeDeleteDialog
        open={deleteTarget !== null}
        themeName={deleteTarget?.name ?? null}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setPendingDelete(false)
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
    </FeaturePage>
  )
}

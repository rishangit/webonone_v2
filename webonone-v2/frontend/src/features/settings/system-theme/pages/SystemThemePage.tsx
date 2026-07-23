import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, FeaturePage, ListPageBody, ListSearchField, Pagination } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { ThemeCreateDialog } from '../components/ThemeCreateDialog'
import { ThemeDeleteDialog } from '../components/ThemeDeleteDialog'
import { ThemeList } from '../components/ThemeList'
import type { ThemeFormValues } from '../schemas/themeFormSchema'
import type { ApiTheme } from '../services/themeApi'
import { isFresh } from '@/shared/store/cacheUtils'
import { systemThemeActions } from '../store/systemThemeSlice'

type PendingSave = 'create' | 'edit' | 'delete' | null

export function SystemThemePage() {
  const dispatch = useAppDispatch()
  const { themes, preferences, status, error, themesFetchedAt, preferencesFetchedAt } =
    useAppSelector((s) => s.systemTheme)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ApiTheme | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiTheme | null>(null)
  const [pendingSave, setPendingSave] = useState<PendingSave>(null)
  const [themePage, setThemePage] = useState(1)
  const [themePageSize, setThemePageSize] = useState(12)
  const [themeSearchQuery, setThemeSearchQuery] = useState('')

  const filteredThemes = useMemo(() => {
    const query = themeSearchQuery.trim().toLowerCase()
    if (!query) return themes
    return themes.filter((theme) => theme.name.toLowerCase().includes(query))
  }, [themes, themeSearchQuery])

  const dialogOpen = createOpen || editing !== null
  const dialogMode = editing ? 'edit' : 'create'
  const isSaving = status === 'saving' && pendingSave !== null
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
    if (createOpen || editing) {
      dispatch(systemThemeActions.clearError())
    }
  }, [createOpen, editing, dispatch])

  useEffect(() => {
    if (deleteTarget) {
      dispatch(systemThemeActions.clearError())
    }
  }, [deleteTarget, dispatch])

  useEffect(() => {
    if (!pendingSave) return

    if (status === 'idle') {
      if (pendingSave === 'create') setCreateOpen(false)
      if (pendingSave === 'edit') setEditing(null)
      if (pendingSave === 'delete') setDeleteTarget(null)
      setPendingSave(null)
    } else if (status === 'error') {
      // Keep pendingSave so the open dialog can show the error; user retries or cancels.
    }
  }, [status, pendingSave])

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false)
      setEditing(null)
      setPendingSave(null)
    }
  }

  function handleSubmit(values: ThemeFormValues) {
    if (editing) {
      setPendingSave('edit')
      dispatch(systemThemeActions.updateThemeRequested({ id: editing.id, values }))
      return
    }

    setPendingSave('create')
    dispatch(systemThemeActions.createThemeRequested(values))
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    setPendingSave('delete')
    dispatch(systemThemeActions.deleteThemeRequested(deleteTarget.id))
  }

  const editInitialValues: ThemeFormValues | undefined = editing
    ? {
        name: editing.name,
        color1: editing.color1,
        color2: editing.color2,
        color3: editing.color3,
        color4: editing.color4,
        color5: editing.color5,
      }
    : undefined

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
          <ListSearchField
            value={themeSearchQuery}
            onChange={(value) => {
              setThemeSearchQuery(value)
              setThemePage(1)
            }}
            placeholder="Theme name"
            onClear={() => setThemePage(1)}
            aria-label="Search themes"
          />
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create theme
          </Button>
        </div>
      }
    >
      {!dialogOpen && !deleteTarget && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!loading ? (
            <ThemeList
              themes={visibleThemes}
              activeThemeId={preferences?.activeThemeId ?? null}
              emptyMessage={emptyMessage}
              onSelect={(id) => dispatch(systemThemeActions.patchPreferencesRequested({ activeThemeId: id }))}
              onEdit={(theme) => setEditing(theme)}
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

      <ThemeCreateDialog
        mode={dialogMode}
        open={dialogOpen}
        initialValues={editInitialValues}
        colorMode={preferences?.colorMode ?? 'light'}
        isSaving={isSaving && pendingSave !== 'delete'}
        error={dialogOpen && error ? error : null}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmit}
      />

      <ThemeDeleteDialog
        open={deleteTarget !== null}
        themeName={deleteTarget?.name ?? null}
        isDeleting={isSaving && pendingSave === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setPendingSave(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
    </FeaturePage>
  )
}

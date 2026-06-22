import { useEffect, useState } from 'react'
import { Button } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { ColorModeToggle } from '../components/ColorModeToggle'
import { ThemeCreateDialog } from '../components/ThemeCreateDialog'
import { ThemeDeleteDialog } from '../components/ThemeDeleteDialog'
import { ThemeList } from '../components/ThemeList'
import type { ThemeFormValues } from '../schemas/themeFormSchema'
import type { ApiTheme } from '../services/themeApi'
import { systemThemeActions } from '../store/systemThemeSlice'

type PendingSave = 'create' | 'edit' | 'delete' | null

export function SystemThemePage() {
  const dispatch = useAppDispatch()
  const { themes, preferences, status, error } = useAppSelector((s) => s.systemTheme)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ApiTheme | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiTheme | null>(null)
  const [pendingSave, setPendingSave] = useState<PendingSave>(null)

  const dialogOpen = createOpen || editing !== null
  const dialogMode = editing ? 'edit' : 'create'
  const isSaving = status === 'saving' && pendingSave !== null

  useEffect(() => {
    dispatch(systemThemeActions.loadThemesRequested())
    dispatch(systemThemeActions.loadPreferencesRequested())
  }, [dispatch])

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Theme</h1>
        <p className="mt-2 text-muted-foreground">
          Create accent palettes and switch light or dark mode for the platform shell.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Color mode</h2>
        <ColorModeToggle
          value={preferences?.colorMode ?? 'light'}
          onChange={(colorMode) => dispatch(systemThemeActions.patchPreferencesRequested({ colorMode }))}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Themes</h2>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Create theme
          </Button>
        </div>
        <ThemeList
          themes={themes}
          activeThemeId={preferences?.activeThemeId ?? null}
          onSelect={(id) => dispatch(systemThemeActions.patchPreferencesRequested({ activeThemeId: id }))}
          onEdit={(theme) => setEditing(theme)}
          onDelete={(id) => {
            const theme = themes.find((t) => t.id === id)
            if (theme) setDeleteTarget(theme)
          }}
        />
      </section>

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

      {status === 'loading' ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {!dialogOpen && !deleteTarget && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  )
}

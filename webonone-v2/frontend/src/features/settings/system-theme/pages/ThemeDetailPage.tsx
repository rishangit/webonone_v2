import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, AlertDescription, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { ThemeBasicsCard } from '../components/ThemeBasicsCard'
import { ThemeFormDialog } from '../components/ThemeFormDialog'
import { ThemeMetaCard } from '../components/ThemeMetaCard'
import { ThemePaletteCard } from '../components/ThemePaletteCard'
import { ThemePreviewCard } from '../components/ThemePreviewCard'
import type { ThemeWizardStep } from '../schemas/themeFormSchema'
import { systemThemeActions } from '../store/systemThemeSlice'

export function ThemeDetailPage() {
  const { themeId } = useParams<{ themeId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const themes = useAppSelector((s) => s.systemTheme.themes)
  const preferences = useAppSelector((s) => s.systemTheme.preferences)
  const status = useAppSelector((s) => s.systemTheme.status)
  const error = useAppSelector((s) => s.systemTheme.error)
  const themesFetchedAt = useAppSelector((s) => s.systemTheme.themesFetchedAt)
  const preferencesFetchedAt = useAppSelector((s) => s.systemTheme.preferencesFetchedAt)

  const [dialog, setDialog] = useState<{ initialStep: ThemeWizardStep } | null>(null)

  const theme = themeId ? (themes.find((t) => t.id === themeId) ?? null) : null
  const loading = status === 'loading' && !theme
  const canEdit = Boolean(theme && !theme.isSystem)

  usePlatformLoading(loading ? 'Loading theme…' : null)

  useEffect(() => {
    if (!isFresh(themesFetchedAt)) {
      dispatch(systemThemeActions.loadThemesRequested())
    }
    if (!isFresh(preferencesFetchedAt)) {
      dispatch(systemThemeActions.loadPreferencesRequested())
    }
  }, [dispatch, themesFetchedAt, preferencesFetchedAt])

  function openWizard(initialStep: ThemeWizardStep) {
    setDialog({ initialStep })
  }

  if (loading) {
    return null
  }

  if (!themeId) {
    return null
  }

  if (!theme && themesFetchedAt !== null) {
    return (
      <FeaturePage
        title="Theme"
        description="Theme details and palette."
        onBack={() => navigate('/settings/system-theme')}
        backLabel="Back to System Theme"
      >
        <Alert variant="destructive">
          <AlertDescription>{error ?? 'Theme not found.'}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!theme) {
    return null
  }

  const isActive = preferences?.activeThemeId === theme.id
  const colorMode = preferences?.colorMode ?? 'light'

  return (
    <FeaturePage
      title={theme.name}
      description="Theme details and palette."
      onBack={() => navigate('/settings/system-theme')}
      backLabel="Back to System Theme"
    >
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {theme.isSystem ? (
        <Alert className="mb-6">
          <AlertDescription>
            System themes are read-only. Create a custom theme to edit colors and name.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ThemeBasicsCard theme={theme} canEdit={canEdit} onEdit={() => openWizard(1)} />
          <ThemePaletteCard theme={theme} canEdit={canEdit} onEdit={() => openWizard(2)} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-1">
          <ThemePreviewCard theme={theme} colorMode={colorMode} />
          <ThemeMetaCard theme={theme} isActive={isActive} />
        </div>
      </div>

      <ThemeFormDialog
        open={dialog !== null}
        id={themeId}
        initialStep={dialog?.initialStep ?? 1}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSaved={() => {
          dispatch(systemThemeActions.loadThemesRequested({ force: true }))
          setDialog(null)
        }}
      />
    </FeaturePage>
  )
}

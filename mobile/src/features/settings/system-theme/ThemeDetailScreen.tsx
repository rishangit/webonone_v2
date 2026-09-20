import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { themeDtoToColors } from '@webonone/theme'
import {
  Body,
  Button,
  Card,
  ConfirmDialog,
  EditableSectionCard,
  FeatureScreen,
  Muted,
  Spinner,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import {
  THEME_COLOR_KEYS,
  THEME_COLOR_LABELS,
} from '@/features/settings/system-theme/constants/themeDefaults'
import { ThemeColorSwatches } from '@/features/settings/system-theme/components/ThemeColorSwatches'
import { ThemeFormDialog } from '@/features/settings/system-theme/components/ThemeFormDialog'
import { themeApi, type ApiTheme } from '@/features/settings/system-theme/services/themeApi'
import { useAppTheme } from '@/features/theme/AppThemeProvider'
import type { ThemeWizardStep } from '@/features/settings/system-theme/schemas/themeSchemas'

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Muted className="text-xs uppercase tracking-wide">{label}</Muted>
      <Body>{value}</Body>
    </View>
  )
}

export function ThemeDetailScreen({ themeId }: { themeId: string }) {
  const { t } = useTranslation('settings')
  const router = useRouter()
  const { toast } = useToast()
  const { applyPreferences, refresh } = useAppTheme()
  const [theme, setTheme] = useState<ApiTheme | null>(null)
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editStep, setEditStep] = useState<ThemeWizardStep | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [themes, preferences] = await Promise.all([
        themeApi.listThemes(),
        themeApi.getPreferences(),
      ])
      const match = themes.find((item) => item.id === themeId) ?? null
      setTheme(match)
      setActiveThemeId(preferences.activeThemeId)
      setError(match ? null : 'Theme not found.')
    } catch (err) {
      setTheme(null)
      setError(err instanceof Error ? err.message : 'Failed to load theme')
    } finally {
      setLoading(false)
    }
  }, [themeId])

  useEffect(() => {
    void load()
  }, [load])

  const isActive = theme ? activeThemeId === theme.id : false
  const canEdit = Boolean(theme && !theme.isSystem)
  const colors = theme ? themeDtoToColors(theme) : null

  async function handleApply() {
    if (!theme) return
    setBusy(true)
    try {
      const preferences = await themeApi.patchPreferences({ activeThemeId: theme.id })
      applyPreferences(preferences)
      setActiveThemeId(preferences.activeThemeId)
      toast({ title: 'Theme applied' })
    } catch (err) {
      toast({
        title: 'Could not apply theme',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!theme) return
    setBusy(true)
    try {
      await themeApi.deleteTheme(theme.id)
      toast({ title: 'Theme deleted' })
      router.replace('/settings/system-theme' as Href)
    } catch (err) {
      toast({
        title: 'Could not delete theme',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <FeatureScreen
        title={t('systemTheme.detail.title')}
        description="Theme details and palette."
        onBack={() => router.back()}
      >
        <Spinner label="Loading theme…" />
      </FeatureScreen>
    )
  }

  if (!theme) {
    return (
      <FeatureScreen
        title={t('systemTheme.detail.title')}
        description="Theme details and palette."
        onBack={() => router.back()}
      >
        <Body className="text-destructive">{error ?? 'Theme not found.'}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={theme.name}
      description="Theme details and palette."
      onBack={() => router.back()}
      actions={
        <View className="flex-row flex-wrap gap-2">
          {!isActive ? (
            <Button size="sm" loading={busy} onPress={() => void handleApply()}>
              Apply
            </Button>
          ) : null}
          {canEdit ? (
            <Button size="sm" variant="destructive" onPress={() => setDeleteOpen(true)}>
              Delete
            </Button>
          ) : null}
        </View>
      }
    >
      {theme.isSystem ? (
        <Card className="gap-2">
          <Muted>
            System themes are read-only. Create a custom theme to edit colors and name.
          </Muted>
        </Card>
      ) : null}

      <EditableSectionCard
        title={t('systemTheme.cards.basicsTitle')}
        description="Theme identity on the platform"
        canEdit={canEdit}
        onEdit={canEdit ? () => setEditStep(1) : undefined}
      >
        <ProfileField label="Name" value={theme.name} />
      </EditableSectionCard>

      <EditableSectionCard
        title={t('systemTheme.cards.paletteTitle')}
        description="Five accent colors for the platform shell"
        canEdit={canEdit}
        onEdit={canEdit ? () => setEditStep(2) : undefined}
      >
        <ThemeColorSwatches theme={theme} />
        {colors
          ? THEME_COLOR_KEYS.map((key) => (
              <ProfileField key={key} label={THEME_COLOR_LABELS[key]} value={colors[key]} />
            ))
          : null}
      </EditableSectionCard>

      <Card className="gap-3">
        <Subheading>Details</Subheading>
        <Muted>Metadata for this theme.</Muted>
        <ProfileField label="Type" value={theme.isSystem ? 'System theme' : 'Custom theme'} />
        <ProfileField label="Status" value={isActive ? 'Active' : 'Inactive'} />
        <ProfileField label="Created" value={formatDateTime(theme.createdAt)} />
        <ProfileField label="Updated" value={formatDateTime(theme.updatedAt)} />
      </Card>

      <Card className="gap-3">
        <Subheading>Preview</Subheading>
        <Muted>Palette colors used by the platform shell.</Muted>
        <View className="gap-3 rounded-lg border border-border p-4" style={{ backgroundColor: colors?.background }}>
          <View className="rounded-md border border-border p-4" style={{ backgroundColor: colors?.surface }}>
            <Body style={{ color: colors?.text }}>{theme.name}</Body>
            <Muted>Sample surface on background</Muted>
            <View className="mt-3 self-start rounded-full px-4 py-2" style={{ backgroundColor: colors?.primary }}>
              <Body className="text-primary-foreground">Primary</Body>
            </View>
          </View>
        </View>
      </Card>

      {editStep !== null ? (
        <ThemeFormDialog
          open
          themeId={theme.id}
          initialStep={editStep}
          onOpenChange={(open) => {
            if (!open) setEditStep(null)
          }}
          onSaved={() => void Promise.all([load(), refresh()])}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${theme.name}?`}
        description="This action cannot be undone. The theme will be permanently removed."
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={() => void handleDelete()}
      />
    </FeatureScreen>
  )
}

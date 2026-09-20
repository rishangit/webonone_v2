import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect, useRouter, type Href } from 'expo-router'
import {
  Body,
  ConfirmDialog,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { ThemeFormDialog } from '@/features/settings/system-theme/components/ThemeFormDialog'
import { ThemeList } from '@/features/settings/system-theme/components/ThemeList'
import { themeApi, type ApiTheme } from '@/features/settings/system-theme/services/themeApi'
import { useAppTheme } from '@/features/theme/AppThemeProvider'
import { useClientInfiniteList } from '@/shared/hooks/useClientInfiniteList'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'

const PAGE_SIZE = 12

type DialogState = { themeId?: string } | null

export function SystemThemeScreen() {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { applyPreferences, refresh } = useAppTheme()
  const [themes, setThemes] = useState<ApiTheme[]>([])
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiTheme | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextThemes = await themeApi.listThemes()
      setThemes(nextThemes)
    } catch (err) {
      setThemes([])
      setError(err instanceof Error ? err.message : 'Failed to load themes')
    }

    try {
      const preferences = await themeApi.getPreferences()
      setActiveThemeId(preferences.activeThemeId)
    } catch {
      // List still works when preferences cannot be loaded.
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const query = searchQuery.trim().toLowerCase()
  const filteredThemes = useMemo(() => {
    if (!query) return themes
    return themes.filter((theme) => theme.name.toLowerCase().includes(query))
  }, [query, themes])

  const pagination = useClientInfiniteList(filteredThemes, PAGE_SIZE, query)
  const onScroll = useListPageScroll(pagination)
  const emptyMessage = query ? t('systemTheme.list.emptySearch') : t('systemTheme.list.empty')

  async function handleApply(id: string) {
    try {
      const preferences = await themeApi.patchPreferences({ activeThemeId: id })
      applyPreferences(preferences)
      setActiveThemeId(preferences.activeThemeId)
      toast({ title: 'Theme applied' })
    } catch (err) {
      toast({
        title: 'Could not apply theme',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await themeApi.deleteTheme(deleteTarget.id)
      toast({ title: 'Theme deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({
        title: 'Could not delete theme',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <FeatureScreen
      title={t('systemTheme.list.title')}
      description={t('systemTheme.list.description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={searchQuery ? () => setSearchQuery('') : undefined}
            placeholder={t('systemTheme.list.searchPlaceholder')}
            accessibilityLabel={t('systemTheme.list.searchAria')}
          />
          <ListAddButton onPress={() => setDialog({})}>{t('systemTheme.list.createTheme')}</ListAddButton>
        </ListPageActions>
      }
    >
      {loading ? <Spinner label={t('systemTheme.list.loading')} /> : null}
      {!dialog && !deleteTarget && error ? <Body className="text-destructive">{error}</Body> : null}

      {!loading ? (
        <ListPageBody>
          <ThemeList
            themes={pagination.visibleItems}
            activeThemeId={activeThemeId}
            emptyMessage={emptyMessage}
            onOpen={(id) => router.push(`/settings/system-theme/${id}` as Href)}
            onApply={(id) => void handleApply(id)}
            onEdit={(theme) => setDialog({ themeId: theme.id })}
            onDelete={(id) => {
              const theme = themes.find((item) => item.id === id)
              if (theme) setDeleteTarget(theme)
            }}
          />
          <TranslatedListPageFooter
            loadedCount={pagination.loadedCount}
            totalCount={pagination.totalCount}
            hasMore={pagination.hasMore}
            loadingMore={pagination.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {dialog ? (
        <ThemeFormDialog
          open
          themeId={dialog.themeId}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => {
            setDialog(null)
            void load()
            void refresh()
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={
          deleteTarget
            ? t('systemTheme.list.deleteTitleNamed', { name: deleteTarget.name })
            : t('systemTheme.list.deleteTitle')
        }
        description={t('systemTheme.list.deleteDescription')}
        confirmLabel={tc('delete')}
        destructive
        busy={busyId === deleteTarget?.id}
        onConfirm={() => void handleDelete()}
      />
    </FeatureScreen>
  )
}

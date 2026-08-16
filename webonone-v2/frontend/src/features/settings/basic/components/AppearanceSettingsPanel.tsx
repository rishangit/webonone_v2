import { ArrowDownToLine, List, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@webonone/ui-kit'
import type { ColorMode } from '@webonone/theme'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isFresh } from '@/shared/store/cacheUtils'
import { systemThemeActions } from '@/features/settings/system-theme/store/systemThemeSlice'
import type { ListPageMode } from '@/features/settings/system-theme/services/themeApi'

export function AppearanceSettingsPanel() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const { preferences, preferencesFetchedAt } = useAppSelector((s) => s.systemTheme)
  const colorMode = preferences?.colorMode ?? 'light'
  const listPageMode = preferences?.listPageMode ?? 'pagination'

  const appearanceOptions: {
    mode: ColorMode
    title: string
    description: string
    Icon: typeof Sun
  }[] = [
    {
      mode: 'light',
      title: t('appearance.light.title'),
      description: t('appearance.light.description'),
      Icon: Sun,
    },
    {
      mode: 'dark',
      title: t('appearance.dark.title'),
      description: t('appearance.dark.description'),
      Icon: Moon,
    },
  ]

  const listPageOptions: {
    mode: ListPageMode
    title: string
    description: string
    Icon: typeof List
  }[] = [
    {
      mode: 'pagination',
      title: t('appearance.listPage.pagination.title'),
      description: t('appearance.listPage.pagination.description'),
      Icon: List,
    },
    {
      mode: 'on-scroll',
      title: t('appearance.listPage.onScroll.title'),
      description: t('appearance.listPage.onScroll.description'),
      Icon: ArrowDownToLine,
    },
  ]

  useEffect(() => {
    if (!isFresh(preferencesFetchedAt)) {
      dispatch(systemThemeActions.loadPreferencesRequested())
    }
  }, [dispatch, preferencesFetchedAt])

  function handleSelect(mode: ColorMode) {
    if (mode === colorMode) {
      return
    }
    dispatch(systemThemeActions.patchPreferencesRequested({ colorMode: mode }))
  }

  function handleListPageSelect(mode: ListPageMode) {
    if (mode === listPageMode) {
      return
    }
    dispatch(systemThemeActions.patchPreferencesRequested({ listPageMode: mode }))
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('appearance.title')}</CardTitle>
          <CardDescription>{t('appearance.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {appearanceOptions.map(({ mode, title, description, Icon }) => {
              const selected = colorMode === mode
              return (
                <li key={mode}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col items-start gap-3 rounded-lg border px-4 py-4 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-glass-bg hover:border-primary/50',
                    )}
                    onClick={() => handleSelect(mode)}
                    aria-pressed={selected}
                  >
                    <Icon className="h-5 w-5 text-foreground" aria-hidden />
                    <span>
                      <span className="block font-medium text-foreground">{title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('appearance.listPage.title')}</CardTitle>
          <CardDescription>{t('appearance.listPage.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {listPageOptions.map(({ mode, title, description, Icon }) => {
              const selected = listPageMode === mode
              return (
                <li key={mode}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col items-start gap-3 rounded-lg border px-4 py-4 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-glass-bg hover:border-primary/50',
                    )}
                    onClick={() => handleListPageSelect(mode)}
                    aria-pressed={selected}
                  >
                    <Icon className="h-5 w-5 text-foreground" aria-hidden />
                    <span>
                      <span className="block font-medium text-foreground">{title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

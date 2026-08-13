import { Moon, Sun } from 'lucide-react'
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

export function AppearanceSettingsPanel() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const { preferences, preferencesFetchedAt } = useAppSelector((s) => s.systemTheme)
  const colorMode = preferences?.colorMode ?? 'light'

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

  return (
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
  )
}

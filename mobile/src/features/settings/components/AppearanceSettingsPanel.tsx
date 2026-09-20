import { useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Globe, Moon, Sun } from 'lucide-react-native'
import { Card, Muted, Subheading, useToast } from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { SelectableOptionCard } from '@/features/settings/components/SelectableOptionCard'
import { themeApi, type ColorMode } from '@/features/settings/system-theme/services/themeApi'
import { useAppTheme } from '@/features/theme/AppThemeProvider'
import type { AppLocale } from '@/shared/types'

export function AppearanceSettingsPanel() {
  const { t } = useTranslation('settings')
  const { locale, setLocale } = useSession()
  const { colorMode, applyPreferences } = useAppTheme()
  const { toast } = useToast()
  const [savingMode, setSavingMode] = useState(false)
  const [savingLocale, setSavingLocale] = useState(false)

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

  const languageOptions: {
    locale: AppLocale
    title: string
    description: string
  }[] = [
    { locale: 'en', title: t('language.en.title'), description: t('language.en.description') },
    { locale: 'si', title: t('language.si.title'), description: t('language.si.description') },
  ]

  async function handleColorModeSelect(mode: ColorMode) {
    if (mode === colorMode || savingMode) return
    setSavingMode(true)
    try {
      const preferences = await themeApi.patchPreferences({ colorMode: mode })
      applyPreferences(preferences)
      toast({ title: t('appearance.toast.updated') })
    } catch (err) {
      toast({
        title: t('appearance.toast.updateFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSavingMode(false)
    }
  }

  async function handleLocaleSelect(next: AppLocale) {
    if (next === locale || savingLocale) return
    setSavingLocale(true)
    try {
      await setLocale(next)
      toast({ title: t('language.updated') })
    } catch (err) {
      toast({
        title: t('language.updateFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSavingLocale(false)
    }
  }

  return (
    <View className="gap-4">
      <Card className="gap-4">
        <View className="gap-1">
          <Subheading>{t('appearance.title')}</Subheading>
          <Muted>{t('appearance.description')}</Muted>
        </View>
        <View className="gap-3">
          {appearanceOptions.map(({ mode, title, description, Icon }) => (
            <SelectableOptionCard
              key={mode}
              title={title}
              description={description}
              selected={colorMode === mode}
              Icon={Icon}
              onPress={() => void handleColorModeSelect(mode)}
            />
          ))}
        </View>
        {savingMode ? <Muted>{t('appearance.toast.saving')}</Muted> : null}
      </Card>

      <Card className="gap-4">
        <View className="gap-1">
          <Subheading>{t('language.title')}</Subheading>
          <Muted>{t('language.description')}</Muted>
        </View>
        <View className="gap-3">
          {languageOptions.map(({ locale: optionLocale, title, description }) => (
            <SelectableOptionCard
              key={optionLocale}
              title={title}
              description={description}
              selected={locale === optionLocale}
              Icon={Globe}
              onPress={() => void handleLocaleSelect(optionLocale)}
            />
          ))}
        </View>
        {savingLocale ? <Muted>{t('language.saving')}</Muted> : null}
      </Card>
    </View>
  )
}

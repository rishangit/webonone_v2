import { type ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/features/auth/SessionContext'
import { useAppHeaderLabels } from '@/features/shell/hooks/useAppHeaderLabels'

export function GuestAuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('shell')
  const { locale, setLocale } = useSession()
  const headerLabels = useAppHeaderLabels()

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="p-2">
        <AppHeader
          title={t('brand')}
          showMenuButton={false}
          locale={locale}
          onLocaleChange={(next) => void setLocale(next)}
          labels={headerLabels}
        />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-2 p-2"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

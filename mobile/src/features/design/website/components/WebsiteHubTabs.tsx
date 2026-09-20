import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@webonone/mobile-ui'
import {
  WEBSITE_SECTIONS,
  websiteHubPath,
  type WebsiteSection,
} from '@/features/design/utils/designPaths'

export function WebsiteHubTabs({
  section,
  actions,
}: {
  section: WebsiteSection
  actions?: ReactNode
}) {
  const { t } = useTranslation('website')
  const router = useRouter()

  return (
    <View className="w-full gap-2">
      <Tabs
        value={section}
        onValueChange={(value) => router.replace(websiteHubPath(value as WebsiteSection))}
      >
        <TabsList aria-label={t('ariaSections')}>
          {WEBSITE_SECTIONS.map((item) => (
            <TabsTrigger key={item} value={item}>
              {t(item)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {actions ? (
        <View className="w-full flex-row flex-wrap items-center justify-end gap-2">{actions}</View>
      ) : null}
    </View>
  )
}

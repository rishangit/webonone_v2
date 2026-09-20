import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FeatureScreen,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsPageClassName,
  tabsPageContentClassName,
} from '@webonone/mobile-ui'
import { AccountSettingsPanel } from '@/features/settings/components/AccountSettingsPanel'
import { AppearanceSettingsPanel } from '@/features/settings/components/AppearanceSettingsPanel'
import { AiSettingsPanel } from '@/features/settings/components/AiSettingsPanel'
import { DownloadsSettingsPanel } from '@/features/settings/components/DownloadsSettingsPanel'

type BasicSettingsTab = 'account' | 'appearance' | 'ai' | 'downloads'

type BasicSettingsScreenProps = {
  initialTab?: BasicSettingsTab
}

export function BasicSettingsScreen({ initialTab = 'account' }: BasicSettingsScreenProps) {
  const { t } = useTranslation('settings')
  const [tab, setTab] = useState<BasicSettingsTab>(initialTab)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  return (
    <FeatureScreen title={t('basic.title')} description={t('basic.description')}>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as BasicSettingsTab)}
        className={tabsPageClassName}
      >
        <TabsList aria-label={t('basic.ariaSections')}>
          <TabsTrigger value="account">{t('basic.tabs.account')}</TabsTrigger>
          <TabsTrigger value="appearance">{t('basic.tabs.appearance')}</TabsTrigger>
          <TabsTrigger value="ai">{t('basic.tabs.ai')}</TabsTrigger>
          <TabsTrigger value="downloads">{t('basic.tabs.downloads')}</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className={tabsPageContentClassName}>
          <AccountSettingsPanel />
        </TabsContent>
        <TabsContent value="appearance" className={tabsPageContentClassName}>
          <AppearanceSettingsPanel />
        </TabsContent>
        <TabsContent value="ai" className={tabsPageContentClassName}>
          <AiSettingsPanel />
        </TabsContent>
        <TabsContent value="downloads" className={tabsPageContentClassName}>
          <DownloadsSettingsPanel />
        </TabsContent>
      </Tabs>
    </FeatureScreen>
  )
}

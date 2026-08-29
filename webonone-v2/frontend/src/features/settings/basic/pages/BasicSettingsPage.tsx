import { useTranslation } from 'react-i18next'
import { FeaturePage, Tabs, TabsContent, TabsList, TabsTrigger, tabsPageClassName, tabsPageContentClassName } from '@webonone/ui-kit'
import { AccountSettingsPanel } from '@/features/settings/basic/components/AccountSettingsPanel'
import { AiSettingsPanel } from '@/features/settings/basic/components/AiSettingsPanel'
import { AppearanceSettingsPanel } from '@/features/settings/basic/components/AppearanceSettingsPanel'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'

type BasicSettingsTab = 'account' | 'theme' | 'ai'

const BASIC_SETTINGS_TABS = ['account', 'theme', 'ai'] as const satisfies readonly BasicSettingsTab[]

export function BasicSettingsPage() {
  const { t } = useTranslation('settings')
  const [tab, setTab] = useDetailTabParam(BASIC_SETTINGS_TABS, 'account')

  const tabs: { id: BasicSettingsTab; label: string }[] = [
    { id: 'account', label: t('basic.tabs.account') },
    { id: 'theme', label: t('basic.tabs.appearance') },
    { id: 'ai', label: t('basic.tabs.ai') },
  ]

  return (
    <FeaturePage title={t('basic.title')} description={t('basic.description')}>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as BasicSettingsTab)}
        className={tabsPageClassName}
      >
        <TabsList aria-label={t('basic.ariaSections')}>
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className={tabsPageContentClassName}>
          {tab === 'account' ? (
            <AccountSettingsPanel />
          ) : tab === 'theme' ? (
            <AppearanceSettingsPanel />
          ) : (
            <AiSettingsPanel />
          )}
        </TabsContent>
      </Tabs>
    </FeaturePage>
  )
}

import { useTranslation } from 'react-i18next'
import { FeaturePage, Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'
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
        className="flex flex-col gap-6"
      >
        <TabsList aria-label={t('basic.ariaSections')}>
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-0 outline-none">
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

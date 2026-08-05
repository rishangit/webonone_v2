import { FeaturePage, Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { AccountSettingsPanel } from '@/features/settings/basic/components/AccountSettingsPanel'
import { AppearanceSettingsPanel } from '@/features/settings/basic/components/AppearanceSettingsPanel'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'

type BasicSettingsTab = 'account' | 'theme'

const BASIC_SETTINGS_TABS = ['account', 'theme'] as const satisfies readonly BasicSettingsTab[]

const TABS: { id: BasicSettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'theme', label: 'Theme' },
]

export function BasicSettingsPage() {
  const [tab, setTab] = useDetailTabParam(BASIC_SETTINGS_TABS, 'account')

  return (
    <FeaturePage
      title="Basic Settings"
      description="Manage your active account and appearance."
    >
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as BasicSettingsTab)}
        className="flex flex-col gap-6"
      >
        <TabsList aria-label="Basic Settings sections">
          {TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-0 outline-none">
          {tab === 'account' ? <AccountSettingsPanel /> : <AppearanceSettingsPanel />}
        </TabsContent>
      </Tabs>
    </FeaturePage>
  )
}

import { useTranslation } from 'react-i18next'
import { FeaturePage, Tabs, TabsContent, TabsList, TabsTrigger, tabsPageClassName, tabsPageContentClassName } from '@webonone/ui-kit'
import { AccountSettingsPanel } from '@/features/settings/basic/components/AccountSettingsPanel'
import { AiSettingsPanel } from '@/features/settings/basic/components/AiSettingsPanel'
import { AppearanceSettingsPanel } from '@/features/settings/basic/components/AppearanceSettingsPanel'
import { DownloadsSettingsPanel } from '@/features/settings/basic/components/DownloadsSettingsPanel'
import { PushBroadcastPanel } from '@/features/settings/basic/components/PushBroadcastPanel'
import { useSuperAdminStatus } from '@/features/settings/basic/hooks/useSuperAdminStatus'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'

type BasicSettingsTab = 'account' | 'theme' | 'ai' | 'downloads' | 'push'

const MEMBER_BASIC_SETTINGS_TABS = ['account', 'theme', 'ai', 'downloads'] as const satisfies readonly BasicSettingsTab[]
const SUPER_ADMIN_BASIC_SETTINGS_TABS = [
  ...MEMBER_BASIC_SETTINGS_TABS,
  'push',
] as const satisfies readonly BasicSettingsTab[]

export function BasicSettingsPage() {
  const { t } = useTranslation('settings')
  const { isSuperAdmin } = useSuperAdminStatus()
  const allowedTabs = isSuperAdmin ? SUPER_ADMIN_BASIC_SETTINGS_TABS : MEMBER_BASIC_SETTINGS_TABS
  const [tab, setTab] = useDetailTabParam(allowedTabs, 'account')

  const tabs: { id: BasicSettingsTab; label: string }[] = [
    { id: 'account', label: t('basic.tabs.account') },
    { id: 'theme', label: t('basic.tabs.appearance') },
    { id: 'ai', label: t('basic.tabs.ai') },
    { id: 'downloads', label: t('basic.tabs.downloads') },
    ...(isSuperAdmin ? [{ id: 'push' as const, label: t('basic.tabs.push') }] : []),
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
          ) : tab === 'ai' ? (
            <AiSettingsPanel />
          ) : tab === 'push' ? (
            isSuperAdmin ? (
              <PushBroadcastPanel />
            ) : null
          ) : (
            <DownloadsSettingsPanel />
          )}
        </TabsContent>
      </Tabs>
    </FeaturePage>
  )
}

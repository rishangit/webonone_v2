import { useState } from 'react'
import { FeaturePage, cn } from '@webonone/ui-kit'
import { AccountSettingsPanel } from '@/features/settings/basic/components/AccountSettingsPanel'
import { AppearanceSettingsPanel } from '@/features/settings/basic/components/AppearanceSettingsPanel'

type BasicSettingsTab = 'account' | 'theme'

const TABS: { id: BasicSettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'theme', label: 'Theme' },
]

export function BasicSettingsPage() {
  const [tab, setTab] = useState<BasicSettingsTab>('account')

  return (
    <FeaturePage
      title="Basic Settings"
      description="Manage your active account and appearance."
    >
      <div className="space-y-6">
        <div
          role="tablist"
          aria-label="Basic Settings sections"
          className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`basic-settings-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`basic-settings-panel-${item.id}`}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
                tab === item.id && 'bg-background text-foreground shadow-sm',
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`basic-settings-panel-${tab}`}
          aria-labelledby={`basic-settings-tab-${tab}`}
        >
          {tab === 'account' ? <AccountSettingsPanel /> : <AppearanceSettingsPanel />}
        </div>
      </div>
    </FeaturePage>
  )
}

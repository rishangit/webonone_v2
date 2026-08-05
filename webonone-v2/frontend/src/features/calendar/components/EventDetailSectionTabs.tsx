import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'

export type EventDetailTabId = 'overview' | 'sessions'

type EventDetailSectionTabsProps = {
  ariaLabel: string
  tab: EventDetailTabId
  onTabChange: (tab: EventDetailTabId) => void
  overview: ReactNode
  sessions: ReactNode
}

const TABS: { id: EventDetailTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Sessions' },
]

export function EventDetailSectionTabs({
  ariaLabel,
  tab,
  onTabChange,
  overview,
  sessions,
}: EventDetailSectionTabsProps) {
  const panel = tab === 'overview' ? overview : sessions

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as EventDetailTabId)}
      className="flex flex-col gap-6"
    >
      <TabsList aria-label={ariaLabel}>
        {TABS.map((item) => (
          <TabsTrigger key={item.id} value={item.id}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={tab} className="mt-0 outline-none">
        {panel}
      </TabsContent>
    </Tabs>
  )
}

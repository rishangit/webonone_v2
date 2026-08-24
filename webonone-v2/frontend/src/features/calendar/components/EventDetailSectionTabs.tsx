import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'

export type EventDetailTabId = 'overview' | 'upcoming' | 'past'

type EventDetailSectionTabsProps = {
  ariaLabel: string
  tab: EventDetailTabId
  onTabChange: (tab: EventDetailTabId) => void
  overview: ReactNode
  upcoming: ReactNode
  past: ReactNode
}

export function EventDetailSectionTabs({
  ariaLabel,
  tab,
  onTabChange,
  overview,
  upcoming,
  past,
}: EventDetailSectionTabsProps) {
  const { t } = useTranslation('calendar')
  const tabs: { id: EventDetailTabId; label: string }[] = [
    { id: 'overview', label: t('eventDetail.tabs.overview') },
    { id: 'upcoming', label: t('eventDetail.tabs.upcoming') },
    { id: 'past', label: t('eventDetail.tabs.past') },
  ]
  const panel = tab === 'overview' ? overview : tab === 'past' ? past : upcoming

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as EventDetailTabId)}
      className="flex flex-col gap-6"
    >
      <TabsList aria-label={ariaLabel}>
        {tabs.map((item) => (
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

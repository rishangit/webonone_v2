import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsPageClassName, tabsPageContentClassName } from '@webonone/ui-kit'

export type SessionDetailTab = {
  id: string
  label: string
}

type SessionDetailSectionTabsProps = {
  ariaLabel: string
  tab: string
  onTabChange: (tab: string) => void
  tabs: SessionDetailTab[]
  children: ReactNode
}

export function SessionDetailSectionTabs({
  ariaLabel,
  tab,
  onTabChange,
  tabs,
  children,
}: SessionDetailSectionTabsProps) {
  if (tabs.length <= 1) {
    return <>{children}</>
  }

  return (
    <Tabs
      value={tab}
      onValueChange={onTabChange}
      className={tabsPageClassName}
    >
      <TabsList aria-label={ariaLabel}>
        {tabs.map((item) => (
          <TabsTrigger key={item.id} value={item.id}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={tab} className={tabsPageContentClassName}>
        {children}
      </TabsContent>
    </Tabs>
  )
}

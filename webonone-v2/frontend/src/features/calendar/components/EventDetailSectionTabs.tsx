import type { ReactNode } from 'react'
import { cn } from '@webonone/ui-kit'

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
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`event-detail-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`event-detail-panel-${item.id}`}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
              tab === item.id && 'bg-background text-foreground shadow-sm',
            )}
            onClick={() => onTabChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`event-detail-panel-${tab}`}
        aria-labelledby={`event-detail-tab-${tab}`}
      >
        {panel}
      </div>
    </div>
  )
}

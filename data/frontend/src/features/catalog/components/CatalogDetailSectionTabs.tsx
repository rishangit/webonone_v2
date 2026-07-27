import type { ReactNode } from 'react'
import { cn } from '@webonone/ui-kit'

export type CatalogDetailTabId = 'profile' | 'gallery'

const TABS: { id: CatalogDetailTabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'gallery', label: 'Gallery' },
]

type CatalogDetailSectionTabsProps = {
  ariaLabel: string
  tab: CatalogDetailTabId
  onTabChange: (tab: CatalogDetailTabId) => void
  profile: ReactNode
  gallery: ReactNode
}

export function CatalogDetailSectionTabs({
  ariaLabel,
  tab,
  onTabChange,
  profile,
  gallery,
}: CatalogDetailSectionTabsProps) {
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
            id={`catalog-library-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`catalog-library-panel-${item.id}`}
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
        id={`catalog-library-panel-${tab}`}
        aria-labelledby={`catalog-library-tab-${tab}`}
      >
        {tab === 'profile' ? profile : gallery}
      </div>
    </div>
  )
}

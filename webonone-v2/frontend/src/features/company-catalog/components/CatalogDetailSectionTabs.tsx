import type { ReactNode } from 'react'
import { cn } from '@webonone/ui-kit'

export type CatalogDetailTabId = 'profile' | 'attributes' | 'gallery' | 'variants'

type CatalogDetailSectionTabsProps = {
  ariaLabel: string
  tab: CatalogDetailTabId
  onTabChange: (tab: CatalogDetailTabId) => void
  profile: ReactNode
  attributes: ReactNode
  gallery: ReactNode
  /** Products only — when omitted, Variants tab is hidden. */
  variants?: ReactNode
}

export function CatalogDetailSectionTabs({
  ariaLabel,
  tab,
  onTabChange,
  profile,
  attributes,
  gallery,
  variants,
}: CatalogDetailSectionTabsProps) {
  const tabs: { id: CatalogDetailTabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'attributes', label: 'Attributes' },
  ]
  if (variants != null) {
    tabs.push({ id: 'variants', label: 'Variants' })
  }

  const panel =
    tab === 'profile'
      ? profile
      : tab === 'attributes'
        ? attributes
        : tab === 'gallery'
          ? gallery
          : variants

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`company-catalog-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`company-catalog-panel-${item.id}`}
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
        id={`company-catalog-panel-${tab}`}
        aria-labelledby={`company-catalog-tab-${tab}`}
      >
        {panel}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'

export type CatalogDetailTabId = 'overview' | 'attributes' | 'gallery' | 'variants'

type CatalogDetailSectionTabsProps = {
  ariaLabel: string
  tab: CatalogDetailTabId
  onTabChange: (tab: CatalogDetailTabId) => void
  overview: ReactNode
  attributes: ReactNode
  gallery: ReactNode
  /** Products only — when omitted, Variants tab is hidden. */
  variants?: ReactNode
}

export function CatalogDetailSectionTabs({
  ariaLabel,
  tab,
  onTabChange,
  overview,
  attributes,
  gallery,
  variants,
}: CatalogDetailSectionTabsProps) {
  const tabs: { id: CatalogDetailTabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'attributes', label: 'Attributes' },
  ]
  if (variants != null) {
    tabs.push({ id: 'variants', label: 'Variants' })
  }

  const panel =
    tab === 'overview'
      ? overview
      : tab === 'attributes'
        ? attributes
        : tab === 'gallery'
          ? gallery
          : variants

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as CatalogDetailTabId)}
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

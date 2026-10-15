import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsPageClassName, tabsPageContentClassName } from '@webonone/ui-kit'

export type CatalogDetailTabId = 'overview' | 'attributes' | 'gallery' | 'variants'

type CatalogDetailSectionTabsProps<T extends CatalogDetailTabId = CatalogDetailTabId> = {
  ns: 'products' | 'services' | 'spaces'
  ariaLabel: string
  tab: T
  onTabChange: (tab: T) => void
  overview: ReactNode
  attributes: ReactNode
  gallery: ReactNode
  /** Products only — when omitted, Variants tab is hidden. */
  variants?: ReactNode
}

export function CatalogDetailSectionTabs<T extends CatalogDetailTabId>({
  ns,
  ariaLabel,
  tab,
  onTabChange,
  overview,
  attributes,
  gallery,
  variants,
}: CatalogDetailSectionTabsProps<T>) {
  const { t } = useTranslation(ns)
  const tabs: { id: CatalogDetailTabId; label: string }[] = [
    { id: 'overview', label: t('overview') },
    { id: 'gallery', label: t('gallery') },
    { id: 'attributes', label: t('attributes') },
  ]
  if (variants != null) {
    tabs.push({ id: 'variants', label: t('variants') })
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
      onValueChange={(value) => onTabChange(value as T)}
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
        {panel}
      </TabsContent>
    </Tabs>
  )
}

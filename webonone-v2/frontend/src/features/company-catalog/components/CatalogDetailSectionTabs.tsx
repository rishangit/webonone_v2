import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'

export type CatalogDetailTabId = 'overview' | 'attributes' | 'gallery' | 'variants' | 'workflow'

type CatalogDetailSectionTabsProps<T extends CatalogDetailTabId = CatalogDetailTabId> = {
  ariaLabel: string
  tab: T
  onTabChange: (tab: T) => void
  overview: ReactNode
  attributes: ReactNode
  gallery: ReactNode
  /** Products only — when omitted, Variants tab is hidden. */
  variants?: ReactNode
  /** Services only — when omitted, Workflow tab is hidden. */
  workflow?: ReactNode
}

export function CatalogDetailSectionTabs<T extends CatalogDetailTabId>({
  ariaLabel,
  tab,
  onTabChange,
  overview,
  attributes,
  gallery,
  variants,
  workflow,
}: CatalogDetailSectionTabsProps<T>) {
  const { t } = useTranslation('catalog')
  const tabs: { id: CatalogDetailTabId; label: string }[] = [
    { id: 'overview', label: t('detail.tabs.overview') },
    { id: 'gallery', label: t('detail.tabs.gallery') },
    { id: 'attributes', label: t('detail.tabs.attributes') },
  ]
  if (variants != null) {
    tabs.push({ id: 'variants', label: t('detail.tabs.variants') })
  }
  if (workflow != null) {
    tabs.push({ id: 'workflow', label: t('detail.tabs.workflow') })
  }

  const panel =
    tab === 'overview'
      ? overview
      : tab === 'attributes'
        ? attributes
        : tab === 'gallery'
          ? gallery
          : tab === 'workflow'
            ? workflow
            : variants

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as T)}
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

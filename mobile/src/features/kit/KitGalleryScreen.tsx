import { useState } from 'react'
import {
  FeatureScreen,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsPageClassName,
  tabsPageContentClassName,
} from '@webonone/mobile-ui'
import { ComplexControlsShowcase } from '@/features/kit/pages/ComplexControlsShowcase'
import { ComponentsShowcase } from '@/features/kit/pages/ComponentsShowcase'
import { ControlsShowcase } from '@/features/kit/pages/ControlsShowcase'
import { DialogsShowcase } from '@/features/kit/pages/DialogsShowcase'
import { IconsShowcase } from '@/features/kit/pages/IconsShowcase'
import { PagesShowcase } from '@/features/kit/pages/PagesShowcase'
import { TagsShowcase } from '@/features/kit/pages/TagsShowcase'
import { SHOWCASE_TABS, type ShowcaseTab } from '@/features/kit/showcaseNav'

export function KitGalleryScreen() {
  const [tab, setTab] = useState<ShowcaseTab>('controls')

  return (
    <FeatureScreen
      title="Mobile UI Kit"
      description="Live preview of reusable @webonone/mobile-ui controls. Same sections as the web UI kit showcase."
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as ShowcaseTab)} className={tabsPageClassName}>
        <TabsList aria-label="UI kit sections">
          {SHOWCASE_TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="controls" className={tabsPageContentClassName}>
          <ControlsShowcase />
        </TabsContent>
        <TabsContent value="complex-controls" className={tabsPageContentClassName}>
          <ComplexControlsShowcase />
        </TabsContent>
        <TabsContent value="components" className={tabsPageContentClassName}>
          <ComponentsShowcase />
        </TabsContent>
        <TabsContent value="pages" className={tabsPageContentClassName}>
          <PagesShowcase />
        </TabsContent>
        <TabsContent value="dialogs" className={tabsPageContentClassName}>
          <DialogsShowcase />
        </TabsContent>
        <TabsContent value="icons" className={tabsPageContentClassName}>
          <IconsShowcase />
        </TabsContent>
        <TabsContent value="tags" className={tabsPageContentClassName}>
          <TagsShowcase />
        </TabsContent>
      </Tabs>
    </FeatureScreen>
  )
}

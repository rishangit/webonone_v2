import { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { PageShell } from '@webonone/ui-kit'
import { ThemeToolbar } from '@/components/ThemeToolbar'
import { DEFAULT_SHOWCASE_TAB, parseShowcaseTab, SHOWCASE_TABS, type ShowcaseTab } from '@/components/showcase-nav'
import { ControlsPage } from '@/pages/ControlsPage'
import { ComponentsPage } from '@/pages/ComponentsPage'
import { DialogsPage } from '@/pages/DialogsPage'
import { IconsPage } from '@/pages/IconsPage'
import { TagsPage } from '@/pages/TagsPage'

export function ShowcaseApp() {
  const [tab, setTab] = useState<ShowcaseTab>(() => parseShowcaseTab(window.location.hash))

  useEffect(() => {
    function onHashChange() {
      setTab(parseShowcaseTab(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      window.location.hash = DEFAULT_SHOWCASE_TAB
    }
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleTabChange(value: string) {
    window.location.hash = value
    setTab(value as ShowcaseTab)
  }

  return (
    <PageShell title="UI Kit Showcase">
      <ThemeToolbar />
      <p className="mb-6 text-muted-foreground">
        Live preview of every exported component from @webonone/ui-kit
      </p>
      <Tabs.Root value={tab} onValueChange={handleTabChange}>
        <Tabs.List className="mb-8 flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
          {SHOWCASE_TABS.map((t) => (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="controls" className="space-y-10 outline-none">
          <ControlsPage />
        </Tabs.Content>
        <Tabs.Content value="components" className="space-y-10 outline-none">
          <ComponentsPage />
        </Tabs.Content>
        <Tabs.Content value="dialogs" className="space-y-10 outline-none">
          <DialogsPage />
        </Tabs.Content>
        <Tabs.Content value="icons" className="space-y-10 outline-none">
          <IconsPage />
        </Tabs.Content>
        <Tabs.Content value="tags" className="space-y-10 outline-none">
          <TagsPage />
        </Tabs.Content>
      </Tabs.Root>
    </PageShell>
  )
}

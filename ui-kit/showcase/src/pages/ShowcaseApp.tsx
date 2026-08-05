import { useEffect } from 'react'
import { PageShell, Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'
import { ThemeToolbar } from '@/components/ThemeToolbar'
import {
  DEFAULT_SHOWCASE_TAB,
  parsePagesNestedTab,
  parseShowcaseTab,
  showcaseTabHash,
  SHOWCASE_TABS,
  type PagesNestedTab,
  type ShowcaseTab,
} from '@/components/showcase-nav'
import { useLocationHash } from '@/hooks/useLocationHash'
import { ComplexControlsPage } from '@/pages/ComplexControlsPage'
import { ControlsPage } from '@/pages/ControlsPage'
import { ComponentsPage } from '@/pages/ComponentsPage'
import { DialogsPage } from '@/pages/DialogsPage'
import { IconsPage } from '@/pages/IconsPage'
import { PagesPage } from '@/pages/PagesPage'
import { TagsPage } from '@/pages/TagsPage'

export function ShowcaseApp() {
  const [hash, setHash] = useLocationHash()
  const tab = parseShowcaseTab(hash)
  const pagesNested = parsePagesNestedTab(hash)

  useEffect(() => {
    if (!window.location.hash) {
      setHash(DEFAULT_SHOWCASE_TAB)
      return
    }
    if (window.location.hash.replace(/^#/, '').trim().toLowerCase() === 'pages') {
      setHash(showcaseTabHash('pages', 'list'))
    }
  }, [hash, setHash])

  function handleTabChange(value: string) {
    const next = value as ShowcaseTab
    if (next === 'pages') {
      const current = hash.replace(/^#/, '').trim().toLowerCase()
      if (current === 'pages-list' || current === 'pages-details') {
        return
      }
      setHash(showcaseTabHash('pages', 'list'))
      return
    }
    setHash(showcaseTabHash(next))
  }

  function handlePagesNestedChange(nested: PagesNestedTab) {
    setHash(showcaseTabHash('pages', nested))
  }

  return (
    <PageShell title="UI Kit Showcase">
      <ThemeToolbar />
      <p className="mb-6 text-muted-foreground">
        Live preview of every exported component from @webonone/ui-kit
      </p>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          {SHOWCASE_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="controls" className="space-y-10">
          <ControlsPage />
        </TabsContent>
        <TabsContent value="complex-controls" className="space-y-10">
          <ComplexControlsPage />
        </TabsContent>
        <TabsContent value="components" className="space-y-10">
          <ComponentsPage />
        </TabsContent>
        <TabsContent value="pages" className="space-y-10">
          <PagesPage nested={pagesNested} onNestedChange={handlePagesNestedChange} />
        </TabsContent>
        <TabsContent value="dialogs" className="space-y-10">
          <DialogsPage />
        </TabsContent>
        <TabsContent value="icons" className="space-y-10">
          <IconsPage />
        </TabsContent>
        <TabsContent value="tags" className="space-y-10">
          <TagsPage />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

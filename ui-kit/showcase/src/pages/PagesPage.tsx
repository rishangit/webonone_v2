import { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { pagesNestedHash, parsePagesNestedTab, type PagesNestedTab } from '@/components/showcase-nav'
import { DetailsPageDemo, ListPageDemo } from '@/pages/pages/PageDemos'

const PAGES_NESTED_TABS: { id: PagesNestedTab; label: string }[] = [
  { id: 'list', label: 'List page' },
  { id: 'details', label: 'Details page' },
]

export function PagesPage() {
  const [nested, setNested] = useState<PagesNestedTab>(() =>
    parsePagesNestedTab(window.location.hash),
  )

  useEffect(() => {
    function onHashChange() {
      setNested(parsePagesNestedTab(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleNestedChange(value: string) {
    const next = value as PagesNestedTab
    window.location.hash = pagesNestedHash(next)
    setNested(next)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Page-level compositions that mirror production FeaturePage screens. Prefer copying these
        patterns over the isolated Components demos.
      </p>
      <Tabs.Root value={nested} onValueChange={handleNestedChange}>
        <Tabs.List className="mb-6 flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
          {PAGES_NESTED_TABS.map((t) => (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="list" className="outline-none">
          <ListPageDemo />
        </Tabs.Content>
        <Tabs.Content value="details" className="outline-none">
          <DetailsPageDemo />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

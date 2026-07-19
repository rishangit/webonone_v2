import * as Tabs from '@radix-ui/react-tabs'
import { pagesNestedHash, type PagesNestedTab } from '@/components/showcase-nav'
import { DetailsPageDemo, ListPageDemo } from '@/pages/pages/PageDemos'

const PAGES_NESTED_TABS: { id: PagesNestedTab; label: string }[] = [
  { id: 'list', label: 'List page' },
  { id: 'details', label: 'Details page' },
]

interface PagesPageProps {
  nested: PagesNestedTab
  onNestedChange: (nested: PagesNestedTab) => void
}

export function PagesPage({ nested, onNestedChange }: PagesPageProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Page-level compositions that mirror production FeaturePage screens. Prefer copying these
        patterns over the isolated Components demos.
      </p>
      <Tabs.Root value={nested} onValueChange={(value) => onNestedChange(value as PagesNestedTab)}>
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
        <Tabs.Content id={pagesNestedHash('list')} value="list" className="outline-none">
          <ListPageDemo />
        </Tabs.Content>
        <Tabs.Content id={pagesNestedHash('details')} value="details" className="outline-none">
          <DetailsPageDemo />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

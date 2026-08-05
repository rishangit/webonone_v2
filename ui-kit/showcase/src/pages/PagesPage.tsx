import { Tabs, TabsContent, TabsList, TabsTrigger } from '@webonone/ui-kit'
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
      <Tabs value={nested} onValueChange={(value) => onNestedChange(value as PagesNestedTab)}>
        <TabsList>
          {PAGES_NESTED_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent id={pagesNestedHash('list')} value="list">
          <ListPageDemo />
        </TabsContent>
        <TabsContent id={pagesNestedHash('details')} value="details">
          <DetailsPageDemo onBack={() => onNestedChange('list')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

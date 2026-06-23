import { PLATFORM_ICON_CATEGORIES, PLATFORM_ICONS } from '@/data/platform-icons'
import { DemoSection } from '@/components/DemoSection'

export function IconsPage() {
  return (
    <>
      <DemoSection
        id="icons-overview"
        title="Icon library"
        description="All platform icons use lucide-react. Reuse names from this catalog before adding new glyphs."
      >
        <p className="text-sm text-muted-foreground">
          {PLATFORM_ICONS.length} icons in use across @webonone/ui-kit and the showcase.
          Import with{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">
            import {'{'} IconName {'}'} from &apos;lucide-react&apos;
          </code>
          . Default size in components: <code className="rounded bg-muted px-1 py-0.5">h-4 w-4</code>.
        </p>
      </DemoSection>

      {PLATFORM_ICON_CATEGORIES.map((category) => {
        const icons = PLATFORM_ICONS.filter((entry) => entry.category === category.id)
        if (icons.length === 0) return null

        return (
          <DemoSection
            key={category.id}
            id={`icons-${category.id}`}
            title={category.label}
            description={category.description}
          >
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {icons.map((entry) => {
                const Icon = entry.icon
                return (
                  <li
                    key={entry.name}
                    className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted/50 text-foreground">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-foreground">{entry.name}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{entry.usedIn.join(', ')}</span>
                  </li>
                )
              })}
            </ul>
          </DemoSection>
        )
      })}
    </>
  )
}

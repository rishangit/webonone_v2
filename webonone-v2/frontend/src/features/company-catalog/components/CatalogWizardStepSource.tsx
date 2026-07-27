import { Library, Plus } from 'lucide-react'
import { cn } from '@webonone/ui-kit'

export type CatalogAddSource = 'library' | 'create'

type CatalogWizardStepSourceProps = {
  value: CatalogAddSource | null
  onChange: (source: CatalogAddSource) => void
  entityLabel: string
}

export function CatalogWizardStepSource({
  value,
  onChange,
  entityLabel,
}: CatalogWizardStepSourceProps) {
  const noun = entityLabel.toLowerCase()

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        className={cn(
          'flex flex-col items-start gap-3 rounded-lg border bg-[hsl(var(--glass-bg))] p-4 text-left transition-colors',
          'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          value === 'library'
            ? 'border-primary ring-1 ring-primary'
            : 'border-[hsl(var(--glass-border))]',
        )}
        aria-pressed={value === 'library'}
        onClick={() => onChange('library')}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[hsl(var(--glass-border))] bg-[hsl(var(--input-background))]">
          <Library className="h-5 w-5 text-foreground" aria-hidden />
        </span>
        <span className="space-y-1">
          <span className="block text-sm font-medium text-foreground">Add from library</span>
          <span className="block text-sm text-muted-foreground">
            Link a live Data library {noun}. Customize later from the detail page if needed.
          </span>
        </span>
      </button>

      <button
        type="button"
        className={cn(
          'flex flex-col items-start gap-3 rounded-lg border bg-[hsl(var(--glass-bg))] p-4 text-left transition-colors',
          'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          value === 'create'
            ? 'border-primary ring-1 ring-primary'
            : 'border-[hsl(var(--glass-border))]',
        )}
        aria-pressed={value === 'create'}
        onClick={() => onChange('create')}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[hsl(var(--glass-border))] bg-[hsl(var(--input-background))]">
          <Plus className="h-5 w-5 text-foreground" aria-hidden />
        </span>
        <span className="space-y-1">
          <span className="block text-sm font-medium text-foreground">Create new</span>
          <span className="block text-sm text-muted-foreground">
            Create a company-owned {noun} that is not linked to the library.
          </span>
        </span>
      </button>
    </div>
  )
}

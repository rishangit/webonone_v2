import type { ReactNode } from 'react'
import { cn } from '@webonone/ui-kit'

export function WebsiteSourceChoiceGrid({
  children,
  ariaLabel,
}: {
  children: ReactNode
  ariaLabel?: string
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label={ariaLabel}>
      {children}
    </div>
  )
}

export function WebsiteSourceChoice({
  selected,
  icon,
  title,
  hint,
  onClick,
}: {
  selected: boolean
  icon: ReactNode
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex h-full w-full flex-col items-start gap-3 rounded-lg border bg-[hsl(var(--glass-bg))] p-4 text-left transition-colors',
        'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'border-primary ring-1 ring-primary' : 'border-[hsl(var(--glass-border))]',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[hsl(var(--glass-border))] bg-[hsl(var(--input-background))]">
        {icon}
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}

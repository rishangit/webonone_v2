import { cn } from '../lib/utils'

export interface ListEmptyStateProps {
  /** Plural noun for default message, e.g. `"tags"` → `No tags found.` */
  itemType: string
  /** Override the default `No {itemType} found.` message */
  message?: string
  className?: string
}

function ListEmptyState({ itemType, message, className }: ListEmptyStateProps) {
  const text = message ?? `No ${itemType} found.`

  return (
    <p role="status" className={cn('py-4 text-center text-sm text-muted-foreground', className)}>
      {text}
    </p>
  )
}

export { ListEmptyState }

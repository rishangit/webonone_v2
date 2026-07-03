import { useEffect, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'

export interface ListFilterTriggerProps {
  active: boolean
  onClick: () => void
  'aria-label'?: string
  className?: string
}

function ListFilterTrigger({
  active,
  onClick,
  'aria-label': ariaLabel = 'Filters',
  className,
}: ListFilterTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(active && 'border-primary text-primary', className)}
      onClick={onClick}
    >
      <SlidersHorizontal className="h-4 w-4" />
    </Button>
  )
}

export interface ListFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
  onApply?: () => void
  onClear?: () => void
  className?: string
}

function ListFilterPanel({
  open,
  onOpenChange,
  title = 'Filters',
  children,
  onApply,
  onClear,
  className,
}: ListFilterPanelProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!open) {
    return null
  }

  function handleApply() {
    onApply?.()
    onOpenChange(false)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close filters"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'glass-card fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l shadow-lg transition-transform duration-200',
          className,
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close filters"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-themed">
          {children}
        </div>

        <footer className="flex shrink-0 gap-2 border-t p-4">
          {onClear ? (
            <Button type="button" variant="outline" className="flex-1" onClick={onClear}>
              Clear
            </Button>
          ) : null}
          <Button type="button" className="flex-1" onClick={handleApply}>
            Apply
          </Button>
        </footer>
      </div>
    </>
  )
}

export { ListFilterPanel, ListFilterTrigger }

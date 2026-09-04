import { useEffect, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  shellPanelBodyClassName,
  shellPanelFooterBaseClassName,
  shellPanelHeaderClassName,
  shellPanelSurfaceClassName,
  shellSlidePanelClassName,
  useShapedShellPanelClassName,
} from '../layouts/shellPanelChrome'
import { useShellSlidePanel } from '../layouts/useShellSlidePanel'
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
      className={cn('h-9 w-9 shrink-0', active && 'border-primary text-primary', className)}
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
  const shapedShell = useShapedShellPanelClassName()
  const closeFilters = () => onOpenChange(false)

  const { isDesktop, mobileSlidePanelClassName, renderMobilePanel } = useShellSlidePanel({
    open,
    onClose: closeFilters,
    closeLabel: 'Close filters',
  })

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

  const panel = (
    <div
      role="dialog"
      aria-modal={!isDesktop}
      aria-label={title}
      className={cn(
        'app-shell-filter-panel flex min-h-0 flex-col overflow-hidden',
        shellPanelSurfaceClassName,
        shapedShell,
        isDesktop ? shellSlidePanelClassName : mobileSlidePanelClassName,
        shapedShell && 'border-l-0',
        className,
      )}
    >
      <header className={shellPanelHeaderClassName}>
        <h2 className="text-base font-semibold">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close filters"
          onClick={closeFilters}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className={shellPanelBodyClassName}>{children}</div>

      {onApply || onClear ? (
        <footer className={cn(shellPanelFooterBaseClassName, 'flex gap-2')}>
          {onClear ? (
            <Button type="button" variant="outline" className="flex-1" onClick={onClear}>
              Clear
            </Button>
          ) : null}
          <Button type="button" className="flex-1" onClick={handleApply}>
            Apply
          </Button>
        </footer>
      ) : null}
    </div>
  )

  return isDesktop ? panel : renderMobilePanel(panel)
}

export { ListFilterPanel, ListFilterTrigger }

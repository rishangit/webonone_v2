import { useContext, useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import { PageHeaderSearchContext } from '../layouts/page-header-search-context'
import { usePageHeaderSearchController } from '../layouts/usePageHeaderSearchController'

/** Same motion and hit area as `PageHeader` actions row (hub tabs, embed list toolbars). */
function listToolbarSearchOverlayClassName(expanded: boolean, revealed: boolean) {
  return cn(
    'absolute inset-y-0 z-10 flex items-center justify-end overflow-hidden sm:hidden',
    'right-[-2.75rem] transition-[left] duration-300 ease-out',
    expanded ? 'left-0' : 'left-[calc(100%+0.5rem)]',
    revealed ? 'visible pointer-events-auto' : 'invisible pointer-events-none',
  )
}

export interface ListPageActionsProps {
  children: ReactNode
  className?: string
}

function ListPageActionsInHeader({ children, className }: ListPageActionsProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center justify-end gap-2 max-sm:flex-nowrap',
        className,
      )}
    >
      {children}
    </div>
  )
}

function ListPageActionsStandalone({ children, className }: ListPageActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { controller, setOverlayEl, mobileSearchRevealed, addExpanded, close, collapseAdd } =
    usePageHeaderSearchController()

  useEffect(() => {
    if (!mobileSearchRevealed && !addExpanded) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close()
        collapseAdd()
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (target instanceof Element && target.closest('[data-list-add-button]')) return
      if (!(target instanceof Node)) return
      collapseAdd()
      if (containerRef.current?.contains(target)) return
      close()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [mobileSearchRevealed, addExpanded, close, collapseAdd])

  const overlayClasses = listToolbarSearchOverlayClassName(controller.expanded, controller.revealed)

  return (
    <PageHeaderSearchContext.Provider value={controller}>
      <div
        ref={containerRef}
        className={cn(
          'flex w-full min-h-9 items-center justify-end gap-2 max-sm:flex-nowrap max-sm:justify-between',
          className,
        )}
      >
        <div className="relative min-h-9 min-w-0 max-sm:flex-1 sm:hidden">
          <div ref={setOverlayEl} className={overlayClasses} />
        </div>
        <div
          className="flex shrink-0 items-center justify-end gap-2 max-sm:flex-nowrap sm:flex-wrap sm:justify-end"
        >
          {children}
        </div>
      </div>
    </PageHeaderSearchContext.Provider>
  )
}

/** Toolbar row for list pages (search + filter + add) with compact expand on viewports below `sm`. */
export function ListPageActions({ children, className }: ListPageActionsProps) {
  const parentSearch = useContext(PageHeaderSearchContext)

  if (parentSearch !== null) {
    return <ListPageActionsInHeader className={className}>{children}</ListPageActionsInHeader>
  }

  return <ListPageActionsStandalone className={className}>{children}</ListPageActionsStandalone>
}

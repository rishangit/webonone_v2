import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/Button'
import { cn } from '../lib/utils'
import { PageHeaderSearchContext } from './page-header-search-context'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  onBack?: () => void
  backLabel?: string
  className?: string
}

const SEARCH_CLOSE_MS = 300

function mobileSearchOverlayClassName(expanded: boolean, revealed: boolean) {
  return cn(
    'absolute inset-y-0 z-10 flex items-center justify-end overflow-hidden sm:hidden',
    'right-[-2.75rem] transition-[left] duration-300 ease-out',
    expanded ? 'left-0' : 'left-[calc(100%+0.5rem)]',
    revealed ? 'visible' : 'invisible pointer-events-none',
  )
}

function PageHeader({
  title,
  description,
  actions,
  onBack,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false)
  const [mobileSearchRevealed, setMobileSearchRevealed] = useState(false)
  const [addExpanded, setAddExpanded] = useState(false)
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null)

  const close = useCallback(() => {
    setMobileSearchExpanded(false)
  }, [])

  const collapseAdd = useCallback(() => {
    setAddExpanded(false)
  }, [])

  const open = useCallback(() => {
    setAddExpanded(false)
    setMobileSearchRevealed(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMobileSearchExpanded(true))
    })
  }, [])

  const expandAdd = useCallback(() => {
    setMobileSearchExpanded(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAddExpanded(true))
    })
  }, [])

  const searchController = useMemo(
    () => ({
      expanded: mobileSearchExpanded,
      revealed: mobileSearchRevealed,
      overlayEl,
      open,
      close,
      addExpanded,
      expandAdd,
      collapseAdd,
    }),
    [mobileSearchExpanded, mobileSearchRevealed, overlayEl, open, close, addExpanded, expandAdd, collapseAdd],
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)')

    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMobileSearchExpanded(false)
        setMobileSearchRevealed(false)
        setAddExpanded(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (mobileSearchExpanded || !mobileSearchRevealed) return
    const timeoutId = window.setTimeout(() => setMobileSearchRevealed(false), SEARCH_CLOSE_MS)
    return () => window.clearTimeout(timeoutId)
  }, [mobileSearchExpanded, mobileSearchRevealed])

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
      if (headerRef.current?.contains(target)) return
      close()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [mobileSearchRevealed, addExpanded, close, collapseAdd])

  const overlayClasses = mobileSearchOverlayClassName(mobileSearchExpanded, mobileSearchRevealed)
  const actionsNode = actions ? (
    <div className="flex shrink-0 items-center justify-end gap-2 max-sm:flex-nowrap max-sm:[&>div]:flex-nowrap sm:flex-wrap">
      {actions}
    </div>
  ) : null

  return (
    <PageHeaderSearchContext.Provider value={searchController}>
      <header ref={headerRef} className={cn('space-y-1', className)}>
        <div className="flex items-start gap-2">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 h-9 w-9 shrink-0"
              aria-label={backLabel}
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            {description ? (
              <>
                <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
                {actions ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative min-h-9 min-w-0 flex-1">
                      <div ref={setOverlayEl} className={overlayClasses} />
                    </div>
                    {actionsNode}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex min-h-9 min-w-0 flex-1 items-center">
                  <h1
                    aria-hidden={mobileSearchExpanded || undefined}
                    className={cn(
                      'min-w-0 flex-1 overflow-hidden truncate text-2xl font-semibold text-foreground transition-transform duration-300 ease-out',
                      mobileSearchExpanded && 'max-sm:-translate-x-full',
                    )}
                  >
                    {title}
                  </h1>
                  {actions ? <div ref={setOverlayEl} className={overlayClasses} /> : null}
                </div>
                {actionsNode}
              </div>
            )}
          </div>
        </div>
      </header>
    </PageHeaderSearchContext.Provider>
  )
}

export { PageHeader }
export type { PageHeaderProps }

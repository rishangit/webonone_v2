import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../lib/utils'
import { useUiTheme } from '../ui-theme/UiThemeContext'
import { themeNeedsShapeDom } from '../ui-theme/uiTheme'
import { inputFocusRingClassName } from './Input'

/** Horizontal scroll viewport for the tab strip. */
export const tabsListScrollClassName = cn(
  'w-full min-w-0 overflow-x-auto overflow-y-visible scroll-smooth leading-none',
  'overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]',
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
)

/** Inner tab row — grows with tab count; parent scroll viewport clips overflow. */
export const tabsListClassName = 'flex w-max flex-nowrap items-end px-3'

/** Full-width shell for high-tech tab strip (no bottom rule — shape-only tabs). */
export const tabsListShellClassName = 'ui-tabs-list-shell w-full min-w-0'

export const tabsListShellClassicClassName = 'w-full min-w-0 border-b border-border'

/** Wraps each trigger — card-style ::before accent + top-right chamfer on the trigger. */
export const tabsTriggerShellClassName = 'ui-tabs-trigger-shell'

/**
 * High-tech tab trigger — borderless; active state matches sidebar nav (`bg-accent/60`).
 * Chamfered silhouette from `.ui-tabs-trigger` clip-path in globals.css.
 */
export const tabsTriggerClassName = cn(
  'ui-tabs-trigger inline-flex shrink-0 touch-pan-x select-none items-center justify-center whitespace-nowrap border-0 bg-muted px-6 py-1.5 text-sm font-medium text-muted-foreground/60 transition-colors',
  'hover:text-muted-foreground',
  'disabled:pointer-events-none disabled:opacity-50',
  'data-[state=active]:z-10 data-[state=active]:bg-accent/60 data-[state=active]:text-foreground',
)

export const tabsTriggerClassicClassName = cn(
  'inline-flex shrink-0 touch-pan-x select-none items-center justify-center whitespace-nowrap rounded-t-lg border border-transparent bg-muted px-6 py-1.5 text-sm font-medium text-muted-foreground/60 transition-colors',
  'hover:text-muted-foreground',
  'disabled:pointer-events-none disabled:opacity-50',
  'data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground',
)

/** Standard tab page layout — consistent title → strip → panel spacing (classic + high-tech). */
export const tabsPageClassName = 'flex flex-col gap-6'

/** Tab panel on feature/detail pages — defers strip gap to parent `tabsPageClassName`. */
export const tabsPageContentClassName = 'mt-0 outline-none'

export const tabsContentClassName = 'ui-tabs-content py-6 outline-none'

const Tabs = TabsPrimitive.Root

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') {
        ref(node)
      } else {
        ref.current = node
      }
    }
  }
}

function useTabsListTouchScroll(scrollRef: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let startX = 0
    let startScrollLeft = 0
    let isSwiping = false

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      startX = event.touches[0].clientX
      startScrollLeft = el.scrollLeft
      isSwiping = false
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const deltaX = event.touches[0].clientX - startX
      if (!isSwiping) {
        if (Math.abs(deltaX) < 8) return
        isSwiping = true
      }
      el.scrollLeft = startScrollLeft - deltaX
      event.preventDefault()
    }

    const onTouchEnd = () => {
      isSwiping = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [scrollRef])
}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const uiTheme = useUiTheme()
  const shapeDom = themeNeedsShapeDom(uiTheme)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<React.ComponentRef<typeof TabsPrimitive.List>>(null)

  useTabsListTouchScroll(scrollRef)

  React.useLayoutEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const scrollActiveIntoView = () => {
      const active = scrollEl.querySelector<HTMLElement>('[data-state="active"]')
      active?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
    }

    scrollActiveIntoView()

    const list = listRef.current
    if (!list) return

    const observer = new MutationObserver(scrollActiveIntoView)
    observer.observe(list, { attributes: true, attributeFilter: ['data-state'], subtree: true })

    return () => observer.disconnect()
  }, [])

  const list = (
    <div ref={scrollRef} className={tabsListScrollClassName}>
      <TabsPrimitive.List
        ref={mergeRefs(listRef, ref)}
        className={cn(tabsListClassName, className)}
        {...props}
      />
    </div>
  )

  if (!shapeDom) {
    return <div className={tabsListShellClassicClassName}>{list}</div>
  }

  return <div className={tabsListShellClassName}>{list}</div>
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const uiTheme = useUiTheme()
  const shapeDom = themeNeedsShapeDom(uiTheme)

  const trigger = (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        shapeDom ? tabsTriggerClassName : tabsTriggerClassicClassName,
        inputFocusRingClassName,
        className,
      )}
      {...props}
    />
  )

  if (!shapeDom) {
    return trigger
  }

  return <span className={tabsTriggerShellClassName}>{trigger}</span>
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(tabsContentClassName, inputFocusRingClassName, className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

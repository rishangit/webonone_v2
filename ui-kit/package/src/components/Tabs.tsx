import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../lib/utils'
import { inputFocusRingClassName } from './Input'

/** Horizontal scroll viewport for the tab strip. */
export const tabsListScrollClassName = cn(
  'w-full min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth',
  'overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]',
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
)

/** Inner tab row — grows with tab count; parent scroll viewport clips overflow. */
export const tabsListClassName = 'inline-flex w-max flex-nowrap items-end px-3'

/** Full-width shell below the tab strip. */
export const tabsListShellClassName = 'w-full min-w-0 border-b border-secondary'

/**
 * Tab trigger base styles.
 * Active: theme secondary border on top/left/right; page-colored bottom; secondary text;
 * outer bottom curves via `.ui-tabs-trigger` ::before/::after.
 */
export const tabsTriggerClassName = cn(
  'ui-tabs-trigger inline-flex shrink-0 touch-pan-x select-none items-center justify-center whitespace-nowrap rounded-t-md border-0 border-t border-r border-[hsl(var(--glass-border))] bg-muted px-6 py-1.5 text-sm font-medium text-muted-foreground/60 transition-colors',
  'hover:text-muted-foreground',
  'disabled:pointer-events-none disabled:opacity-50',
  'data-[state=active]:z-10 data-[state=active]:-mb-px data-[state=active]:border data-[state=active]:border-secondary data-[state=active]:border-b-[hsl(var(--background-base))] data-[state=active]:bg-[hsl(var(--background-base))] data-[state=active]:text-secondary',
)

export const tabsContentClassName = 'mt-4 outline-none'

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

  return (
    <div className={tabsListShellClassName}>
      <div ref={scrollRef} className={tabsListScrollClassName}>
        <TabsPrimitive.List
          ref={mergeRefs(listRef, ref)}
          className={cn(tabsListClassName, className)}
          {...props}
        />
      </div>
    </div>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerClassName, inputFocusRingClassName, className)}
    {...props}
  />
))
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

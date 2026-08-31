import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../lib/utils'
import { inputFocusRingClassName } from './Input'

/** Horizontal scroll viewport for the tab strip. */
export const tabsListScrollClassName = cn(
  'w-full min-w-0 overflow-x-auto overflow-y-visible scroll-smooth leading-none',
  'overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]',
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
)

/** Inner tab row — segmented track; grows with tab count inside scroll viewport. */
export const tabsListClassName = cn(
  'ui-tabs-list-classic inline-flex w-max flex-nowrap items-stretch gap-0',
  'ui-shape-control border border-input bg-transparent p-1 h-10',
)

/** Outer shell — width only; track chrome lives on {@link tabsListClassName}. */
export const tabsListShellClassicClassName = 'ui-tabs-list-shell-classic w-full min-w-0'

/** @deprecated Use {@link tabsListShellClassicClassName}. Alias kept for compatibility. */
export const tabsListShellClassName = tabsListShellClassicClassName

/** @deprecated Trigger wrapper removed — tabs are direct list children. */
export const tabsTriggerShellClassicClassName = 'ui-tabs-trigger-shell-classic'

/** @deprecated Use {@link tabsTriggerShellClassicClassName}. */
export const tabsTriggerShellClassName = tabsTriggerShellClassicClassName

const tabsTriggerSharedClassName =
  'ui-control-label inline-flex h-full min-h-0 min-w-0 shrink-0 touch-pan-x select-none items-center justify-center whitespace-nowrap px-5 text-sm font-medium leading-none transition-colors disabled:pointer-events-none disabled:opacity-50 has-[svg]:px-6'

const tabsTriggerClassicBaseClassName = cn(
  tabsTriggerSharedClassName,
  'data-[state=inactive]:text-label data-[state=inactive]:hover:text-primary',
)

/** Segmented tab trigger — active paint matches SegmentedSwitch in globals.css. */
export const tabsTriggerClassicClassName = cn('ui-tabs-trigger-classic border-0', tabsTriggerClassicBaseClassName)

/** @deprecated Use {@link tabsTriggerClassicClassName}. */
export const tabsTriggerClassName = tabsTriggerClassicClassName

/** Standard tab page layout — consistent title → strip → panel spacing (classic + high-tech). */
export const tabsPageClassName = 'flex flex-col gap-2'

/** Tab panel on feature/detail pages — defers strip gap to parent `tabsPageClassName`. */
export const tabsPageContentClassName = 'mt-0 outline-none'

export const tabsContentClassName = 'ui-tabs-content pt-2 pb-4 outline-none'

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

    let activeValue: string | null = null

    const scrollActiveTabHorizontally = (behavior: ScrollBehavior = 'smooth') => {
      const active = scrollEl.querySelector<HTMLElement>('[data-state="active"]')
      if (!active) return

      const left = active.offsetLeft
      const width = active.offsetWidth
      const viewport = scrollEl.clientWidth
      const maxScroll = scrollEl.scrollWidth - viewport
      const target = left - (viewport - width) / 2
      scrollEl.scrollTo({
        left: Math.max(0, Math.min(target, maxScroll)),
        behavior,
      })
    }

    const scrollActiveIntoView = () => {
      const active = scrollEl.querySelector<HTMLElement>('[data-state="active"]')
      if (!active) return

      const nextValue = active.getAttribute('value') ?? active.textContent ?? ''
      if (activeValue === null) {
        activeValue = nextValue
        return
      }
      if (activeValue === nextValue) return
      activeValue = nextValue
      scrollActiveTabHorizontally('smooth')
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

  return <div className={tabsListShellClassicClassName}>{list}</div>
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerClassicClassName, inputFocusRingClassName, className)}
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

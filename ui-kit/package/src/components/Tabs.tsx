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

const tabVisibilityEpsilonPx = 1

function activeTabElement(scrollEl: HTMLElement): HTMLElement | null {
  return scrollEl.querySelector<HTMLElement>('[data-state="active"]')
}

function tabValueKey(tab: HTMLElement): string {
  return tab.getAttribute('value') ?? tab.textContent ?? ''
}

function isTabFullyVisible(scrollEl: HTMLElement, tab: HTMLElement): boolean {
  const view = scrollEl.getBoundingClientRect()
  const rect = tab.getBoundingClientRect()
  return (
    rect.left >= view.left - tabVisibilityEpsilonPx &&
    rect.right <= view.right + tabVisibilityEpsilonPx
  )
}

function scrollTabIntoCenter(scrollEl: HTMLElement, tab: HTMLElement, behavior: ScrollBehavior) {
  const view = scrollEl.getBoundingClientRect()
  const rect = tab.getBoundingClientRect()
  const delta = rect.left - view.left - (view.width - rect.width) / 2
  const maxScroll = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth)
  const target = Math.max(0, Math.min(scrollEl.scrollLeft + delta, maxScroll))
  scrollEl.scrollTo({ left: target, behavior })
}

function useTabsListTouchScroll(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  userScrollIntentRef: React.MutableRefObject<boolean>,
) {
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
        userScrollIntentRef.current = true
      }
      el.scrollLeft = startScrollLeft - deltaX
      event.preventDefault()
    }

    const onTouchEnd = () => {
      isSwiping = false
      userScrollIntentRef.current = false
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
  }, [scrollRef, userScrollIntentRef])
}

function useTabsListScrollPosition(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  userScrollIntentRef: React.MutableRefObject<boolean>,
) {
  React.useLayoutEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    let activeValue: string | null = null
    let savedScrollLeft = 0
    let restoring = false
    let wheelIntentTimer = 0

    const onWheel = () => {
      userScrollIntentRef.current = true
      window.clearTimeout(wheelIntentTimer)
      wheelIntentTimer = window.setTimeout(() => {
        userScrollIntentRef.current = false
      }, 200)
    }

    const restoreSavedOffset = () => {
      restoring = true
      scrollEl.scrollTo({ left: savedScrollLeft, behavior: 'auto' })
      restoring = false
    }

    const keepSelectedTabInPlace = (behavior: ScrollBehavior) => {
      const active = activeTabElement(scrollEl)
      if (!active) return

      const nextValue = tabValueKey(active)
      const first = activeValue === null
      const changed = !first && activeValue !== nextValue
      activeValue = nextValue

      if (isTabFullyVisible(scrollEl, active)) {
        savedScrollLeft = scrollEl.scrollLeft
        return
      }

      const jumpedToStart =
        !changed &&
        !userScrollIntentRef.current &&
        savedScrollLeft > 0 &&
        scrollEl.scrollLeft === 0

      if (jumpedToStart) {
        restoreSavedOffset()
        if (isTabFullyVisible(scrollEl, active)) return
      }

      if (first || changed) {
        scrollTabIntoCenter(scrollEl, active, first ? 'auto' : behavior)
        savedScrollLeft = scrollEl.scrollLeft
      }
    }

    const onScroll = () => {
      if (restoring) return
      const active = activeTabElement(scrollEl)
      const sameTab = active !== null && activeValue !== null && tabValueKey(active) === activeValue
      const jumpedToStart =
        sameTab &&
        !userScrollIntentRef.current &&
        savedScrollLeft > 0 &&
        scrollEl.scrollLeft === 0

      if (jumpedToStart && active && !isTabFullyVisible(scrollEl, active)) {
        restoreSavedOffset()
        return
      }

      savedScrollLeft = scrollEl.scrollLeft
    }

    keepSelectedTabInPlace('auto')

    const list = scrollEl.querySelector<HTMLElement>('[role="tablist"]')
    const attributeObserver = new MutationObserver(() => keepSelectedTabInPlace('smooth'))
    if (list) {
      attributeObserver.observe(list, {
        attributes: true,
        attributeFilter: ['data-state'],
        subtree: true,
      })
    }

    const resizeObserver = new ResizeObserver(() => keepSelectedTabInPlace('auto'))
    resizeObserver.observe(scrollEl)
    if (list) resizeObserver.observe(list)

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    scrollEl.addEventListener('wheel', onWheel, { passive: true })

    return () => {
      window.clearTimeout(wheelIntentTimer)
      attributeObserver.disconnect()
      resizeObserver.disconnect()
      scrollEl.removeEventListener('scroll', onScroll)
      scrollEl.removeEventListener('wheel', onWheel)
    }
  }, [scrollRef, userScrollIntentRef])
}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const userScrollIntentRef = React.useRef(false)

  useTabsListTouchScroll(scrollRef, userScrollIntentRef)
  useTabsListScrollPosition(scrollRef, userScrollIntentRef)

  const list = (
    <div ref={scrollRef} className={tabsListScrollClassName}>
      <TabsPrimitive.List ref={ref} className={cn(tabsListClassName, className)} {...props} />
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

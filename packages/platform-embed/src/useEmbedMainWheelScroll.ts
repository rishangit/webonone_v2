import { useEffect, type RefObject } from 'react'

import { shouldUsePlatformEmbedCanvas } from './usePlatformEmbedCanvas'

function normalizeWheelDelta(event: WheelEvent, clientHeight: number): number {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return event.deltaY * 16
    case WheelEvent.DOM_DELTA_PAGE:
      return event.deltaY * clientHeight
    default:
      return event.deltaY
  }
}

/**
 * Workaround for cross-origin iframe embeds where wheel deltas may not scroll
 * `.platform-embed-shell-main` even when overflow-y-auto shows a scrollbar.
 */
export function useEmbedMainWheelScroll(mainRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const main = mainRef.current
    if (!main || !shouldUsePlatformEmbedCanvas()) {
      return
    }

    function handleWheel(event: WheelEvent): void {
      const el = mainRef.current
      if (!el || !el.contains(event.target as Node)) {
        return
      }

      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll <= 0) {
        return
      }

      const delta = normalizeWheelDelta(event, el.clientHeight)
      if (delta === 0) {
        return
      }

      const next = el.scrollTop + delta
      if (next < 0) {
        if (el.scrollTop > 0) {
          el.scrollTop = 0
          event.preventDefault()
        }
        return
      }

      if (next > maxScroll) {
        if (el.scrollTop < maxScroll) {
          el.scrollTop = maxScroll
          event.preventDefault()
        }
        return
      }

      el.scrollTop = next
      event.preventDefault()
    }

    main.addEventListener('wheel', handleWheel, { passive: false })
    return () => main.removeEventListener('wheel', handleWheel)
  }, [mainRef])
}

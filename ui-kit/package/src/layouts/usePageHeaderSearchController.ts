import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PageHeaderSearchController } from './page-header-search-context'

const SEARCH_CLOSE_MS = 300

export function usePageHeaderSearchController() {
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null)
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false)
  const [mobileSearchRevealed, setMobileSearchRevealed] = useState(false)
  const [addExpanded, setAddExpanded] = useState(false)

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

  const controller = useMemo<PageHeaderSearchController>(
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
    [
      mobileSearchExpanded,
      mobileSearchRevealed,
      overlayEl,
      open,
      close,
      addExpanded,
      expandAdd,
      collapseAdd,
    ],
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

  return {
    controller,
    setOverlayEl,
    mobileSearchRevealed,
    addExpanded,
    close,
    collapseAdd,
  }
}

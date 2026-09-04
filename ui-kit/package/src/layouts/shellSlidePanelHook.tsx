import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  shellPanelScrimClassName,
  shellSlidePanelAnchoredClassName,
  shellSlidePanelClassName,
} from './shellPanelChrome'
import { useShellOverlay } from './ShellOverlayProvider'
import { getShellSlideHost } from './shellOverlay'

interface UseShellSlidePanelOptions {
  /** When true, the panel is visible and should register the shared shell overlay on mobile. */
  open: boolean
  onClose: () => void
  closeLabel?: string
  /** Slide-over positioning on all breakpoints; scrim still only on mobile (like left nav). */
  forceSlideOver?: boolean
}

function useShellSlidePanel({
  open,
  onClose,
  closeLabel = 'Close',
  forceSlideOver = false,
}: UseShellSlidePanelOptions) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const overlayId = useId()
  const slideOver = forceSlideOver || !isDesktop
  const useOverlay = open && !isDesktop

  const hasShellOverlay = useShellOverlay({
    id: overlayId,
    open: useOverlay,
    onClose,
    ariaLabel: closeLabel,
  })

  useEffect(() => {
    if (!useOverlay) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [useOverlay])

  const mobileSlidePanelClassName = cn(
    slideOver && open && shellSlidePanelClassName,
    slideOver && open && !isDesktop && hasShellOverlay && shellSlidePanelAnchoredClassName,
    slideOver && open && 'border-l',
  )

  function renderMobilePanel(panel: ReactNode): ReactNode {
    if (!slideOver || !open) {
      return panel
    }

    if (isDesktop) {
      return createPortal(panel, getShellSlideHost())
    }

    if (!hasShellOverlay) {
      return createPortal(
        <>
          <button type="button" className={shellPanelScrimClassName} aria-label={closeLabel} onClick={onClose} />
          {panel}
        </>,
        document.body,
      )
    }

    return createPortal(panel, getShellSlideHost())
  }

  return {
    isDesktop,
    hasShellOverlay,
    mobileSlidePanelClassName,
    renderMobilePanel,
  }
}

export { useShellSlidePanel }
export type { UseShellSlidePanelOptions }

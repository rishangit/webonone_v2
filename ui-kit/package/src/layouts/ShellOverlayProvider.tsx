import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { shellPanelScrimClassName } from './shellPanelChrome'
import { getShellOverlayRoot } from './shellOverlay'

type OverlayEntry = {
  onClose: () => void
  ariaLabel: string
}

type ShellOverlayContextValue = {
  setOverlay: (id: string, open: boolean, onClose: () => void, ariaLabel: string) => void
}

const ShellOverlayContext = createContext<ShellOverlayContextValue | null>(null)
const ShellOverlayActiveContext = createContext(false)

/** Lets shell panels rendered outside AppShell (e.g. core-hosted peer panels) use the same scrim. */
let activeShellOverlayRegistry: ShellOverlayContextValue['setOverlay'] | null = null

function ShellOverlayProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Map<string, OverlayEntry>>(new Map())

  const setOverlay = useCallback((id: string, open: boolean, onClose: () => void, ariaLabel: string) => {
    setEntries((prev) => {
      const next = new Map(prev)
      if (open) {
        next.set(id, { onClose, ariaLabel })
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ setOverlay }), [setOverlay])

  useLayoutEffect(() => {
    activeShellOverlayRegistry = setOverlay
    return () => {
      if (activeShellOverlayRegistry === setOverlay) {
        activeShellOverlayRegistry = null
      }
    }
  }, [setOverlay])

  const activeEntries = [...entries.values()]
  const hasOverlay = activeEntries.length > 0

  function handleScrimClick() {
    activeEntries.forEach((entry) => entry.onClose())
  }

  const scrimLabel = activeEntries.at(-1)?.ariaLabel ?? 'Close'

  return (
    <ShellOverlayActiveContext.Provider value={hasOverlay}>
      <ShellOverlayContext.Provider value={value}>
        {children}
        {hasOverlay
          ? createPortal(
              <button
                type="button"
                className={shellPanelScrimClassName}
                aria-label={scrimLabel}
                onClick={handleScrimClick}
              />,
              getShellOverlayRoot(),
            )
          : null}
      </ShellOverlayContext.Provider>
    </ShellOverlayActiveContext.Provider>
  )
}

function useShellOverlayActive(): boolean {
  return useContext(ShellOverlayActiveContext)
}

function useShellOverlay({
  id,
  open,
  onClose,
  ariaLabel = 'Close',
}: {
  id: string
  open: boolean
  onClose: () => void
  ariaLabel?: string
}) {
  const ctx = useContext(ShellOverlayContext)
  const registerOverlay = ctx?.setOverlay ?? activeShellOverlayRegistry
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    if (!registerOverlay) return
    const close = () => onCloseRef.current()
    registerOverlay(id, open, close, ariaLabel)
    return () => registerOverlay(id, false, close, ariaLabel)
  }, [registerOverlay, id, open, ariaLabel])

  return Boolean(registerOverlay)
}

export { ShellOverlayProvider, useShellOverlay, useShellOverlayActive }

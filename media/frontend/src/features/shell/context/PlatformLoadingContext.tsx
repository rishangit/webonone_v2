import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type LoadingKind = 'page' | 'route'

type PlatformLoadingContextValue = {
  register: (id: string, kind: LoadingKind, label: string) => void
  unregister: (id: string) => void
  overlayLabel: string | null
}

const PlatformLoadingContext = createContext<PlatformLoadingContextValue | null>(null)

const DEFAULT_ROUTE_LOADING_DELAY_MS = 175
const HIDE_LINGER_MS = 200

/** Dev diagnostic: trace loader register/unregister and warn when overlays stack. */
function logLoaders(
  action: 'register' | 'unregister',
  id: string,
  page: Map<string, string>,
  route: Map<string, string>,
): void {
  if (!import.meta.env.DEV) return
  const total = page.size + route.size
  const snapshot = {
    id,
    total,
    page: Array.from(page.values()),
    route: Array.from(route.values()),
  }
  if (total > 1) {
    console.warn(
      `[PlatformLoading] ${action} → ${total} concurrent loaders (possible stacked loading)`,
      snapshot,
    )
  } else {
    console.debug(`[PlatformLoading] ${action} → ${total} active`, snapshot)
  }
}

export function PlatformLoadingProvider({ children }: { children: ReactNode }) {
  const pageLoaders = useRef(new Map<string, string>())
  const routeLoaders = useRef(new Map<string, string>())
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null)
  const hideTimer = useRef<number | null>(null)

  const recompute = useCallback(() => {
    const page = pageLoaders.current
    const route = routeLoaders.current
    let next: string | null = null
    if (page.size > 0) {
      next = Array.from(page.values()).pop() ?? null
    } else if (route.size > 0) {
      next = Array.from(route.values()).pop() ?? null
    }
    setActiveLabel(next)
  }, [])

  const register = useCallback(
    (id: string, kind: LoadingKind, label: string) => {
      const target = kind === 'page' ? pageLoaders.current : routeLoaders.current
      target.set(id, label)
      logLoaders('register', id, pageLoaders.current, routeLoaders.current)
      recompute()
    },
    [recompute],
  )

  const unregister = useCallback(
    (id: string) => {
      pageLoaders.current.delete(id)
      routeLoaders.current.delete(id)
      logLoaders('unregister', id, pageLoaders.current, routeLoaders.current)
      recompute()
    },
    [recompute],
  )

  useEffect(() => {
    if (activeLabel) {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
      setOverlayLabel(activeLabel)
      return
    }

    hideTimer.current = window.setTimeout(() => {
      setOverlayLabel(null)
      hideTimer.current = null
    }, HIDE_LINGER_MS)

    return () => {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
    }
  }, [activeLabel])

  const value = useMemo(
    () => ({ register, unregister, overlayLabel }),
    [register, unregister, overlayLabel],
  )

  return <PlatformLoadingContext.Provider value={value}>{children}</PlatformLoadingContext.Provider>
}

function usePlatformLoadingContext(): PlatformLoadingContextValue {
  const context = useContext(PlatformLoadingContext)
  if (!context) {
    throw new Error('Platform loading hooks must be used within PlatformLoadingProvider')
  }
  return context
}

function useLoadingLabel(kind: LoadingKind, label: string | null | false, enabled: boolean): void {
  const context = useContext(PlatformLoadingContext)
  const id = useId()
  const nextLabel = enabled && label ? label : null

  useLayoutEffect(() => {
    if (!context) {
      return
    }
    if (nextLabel) {
      context.register(id, kind, nextLabel)
    } else {
      context.unregister(id)
    }
    return () => {
      context.unregister(id)
    }
  }, [context, id, kind, nextLabel])
}

/** Register page loading. No-ops outside PlatformLoadingProvider (embed routes). */
export function usePlatformLoading(label: string | null | false, enabled = true): void {
  useLoadingLabel('page', label, enabled)
}

export function useRouteLoading(label: string | null | false): void {
  useLoadingLabel('route', label, true)
}

export function useDelayedRouteLoading(
  label: string,
  delayMs = DEFAULT_ROUTE_LOADING_DELAY_MS,
): void {
  const [showLabel, setShowLabel] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLabel(true), delayMs)
    return () => {
      clearTimeout(timer)
      setShowLabel(false)
    }
  }, [delayMs, label])

  useRouteLoading(showLabel ? label : null)
}

export function usePlatformOverlayLabel(): string | null {
  return usePlatformLoadingContext().overlayLabel
}

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
      `[PlatformLoading] ${action} → ${total} concurrent loaders (possible stacked overlay)`,
      snapshot,
    )
  } else {
    console.debug(`[PlatformLoading] ${action} → ${total} active`, snapshot)
  }
}

function resolveLabel(page: Map<string, string>, route: Map<string, string>): string | null {
  if (page.size > 0) {
    return Array.from(page.values()).pop() ?? null
  }
  if (route.size > 0) {
    return Array.from(route.values()).pop() ?? null
  }
  return null
}

export function PlatformLoadingProvider({ children }: { children: ReactNode }) {
  const pageLoaders = useRef(new Map<string, string>())
  const routeLoaders = useRef(new Map<string, string>())
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null)

  const recompute = useCallback(() => {
    setOverlayLabel(resolveLabel(pageLoaders.current, routeLoaders.current))
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

function useLoadingLabel(kind: LoadingKind, label: string | null | false): void {
  const { register, unregister } = usePlatformLoadingContext()
  const id = useId()
  const nextLabel = label || null

  useLayoutEffect(() => {
    if (nextLabel) {
      register(id, kind, nextLabel)
    } else {
      unregister(id)
    }
    return () => {
      unregister(id)
    }
  }, [id, kind, nextLabel, register, unregister])
}

/** Report page data loading to AppLayout overlay. */
export function usePlatformLoading(label: string | null | false): void {
  useLoadingLabel('page', label)
}

/** Report lazy route chunk loading to AppLayout overlay. */
export function useRouteLoading(label: string | null | false): void {
  useLoadingLabel('route', label)
}

/** Delay route overlay to avoid flash when lazy chunks are already cached. */
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

/** Single overlay label — updates in the same layout pass as loaders register/clear. */
export function usePlatformOverlayLabel(): string | null {
  return usePlatformLoadingContext().overlayLabel
}

/** Alias of overlay label — embed `content-ready` must not wait on a hide linger. */
export function usePlatformActiveLabel(): string | null {
  return usePlatformLoadingContext().overlayLabel
}

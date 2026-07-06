import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type PlatformLoadingContextValue = {
  pageLabel: string | null
  routeLabel: string | null
  setPageLabel: (label: string | null) => void
  setRouteLabel: (label: string | null) => void
}

const PlatformLoadingContext = createContext<PlatformLoadingContextValue | null>(null)

const DEFAULT_ROUTE_LOADING_DELAY_MS = 175

export function PlatformLoadingProvider({ children }: { children: ReactNode }) {
  const [pageLabel, setPageLabel] = useState<string | null>(null)
  const [routeLabel, setRouteLabel] = useState<string | null>(null)
  const value = useMemo(
    () => ({ pageLabel, routeLabel, setPageLabel, setRouteLabel }),
    [pageLabel, routeLabel],
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

function useLoadingLabel(field: 'pageLabel' | 'routeLabel', label: string | null | false): void {
  const context = usePlatformLoadingContext()
  const setter = field === 'pageLabel' ? context.setPageLabel : context.setRouteLabel
  const nextLabel = label || null

  useLayoutEffect(() => {
    setter(nextLabel)
    return () => {
      setter(null)
    }
  }, [nextLabel, setter])
}

export function usePlatformLoading(label: string | null | false): void {
  useLoadingLabel('pageLabel', label)
}

export function useRouteLoading(label: string | null | false): void {
  useLoadingLabel('routeLabel', label)
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

export function usePlatformPageLabel(): string | null {
  return usePlatformLoadingContext().pageLabel
}

export function usePlatformRouteLabel(): string | null {
  return usePlatformLoadingContext().routeLabel
}

import {
  createContext,
  useContext,
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

function useLoadingLabel(
  field: 'pageLabel' | 'routeLabel',
  label: string | null | false,
): void {
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

/** Report page data loading to AppLayout overlay. */
export function usePlatformLoading(label: string | null | false): void {
  useLoadingLabel('pageLabel', label)
}

/** Report lazy route chunk loading to AppLayout overlay. */
export function useRouteLoading(label: string | null | false): void {
  useLoadingLabel('routeLabel', label)
}

export function usePlatformPageLabel(): string | null {
  return usePlatformLoadingContext().pageLabel
}

export function usePlatformRouteLabel(): string | null {
  return usePlatformLoadingContext().routeLabel
}

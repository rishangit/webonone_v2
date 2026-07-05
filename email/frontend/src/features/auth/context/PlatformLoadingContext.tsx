import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type PlatformLoadingContextValue = {
  pageLabel: string | null
  setPageLabel: (label: string | null) => void
}

const PlatformLoadingContext = createContext<PlatformLoadingContextValue | null>(null)

export function PlatformLoadingProvider({ children }: { children: ReactNode }) {
  const [pageLabel, setPageLabel] = useState<string | null>(null)
  const value = useMemo(() => ({ pageLabel, setPageLabel }), [pageLabel])

  return <PlatformLoadingContext.Provider value={value}>{children}</PlatformLoadingContext.Provider>
}

function usePlatformLoadingContext(): PlatformLoadingContextValue {
  const context = useContext(PlatformLoadingContext)
  if (!context) {
    throw new Error('usePlatformLoading must be used within PlatformLoadingProvider')
  }
  return context
}

/** Report page-level loading to AppLayout overlay (single viewport spinner). */
export function usePlatformLoading(label: string | null | false): void {
  const { setPageLabel } = usePlatformLoadingContext()

  useEffect(() => {
    const nextLabel = label || null
    setPageLabel(nextLabel)
    return () => {
      setPageLabel(null)
    }
  }, [label, setPageLabel])
}

export function usePlatformPageLabel(): string | null {
  return usePlatformLoadingContext().pageLabel
}

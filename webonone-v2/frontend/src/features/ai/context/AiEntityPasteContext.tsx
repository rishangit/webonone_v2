import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { PlatformAiEntityRef } from '@webonone/platform-embed'

type AiEntityPasteContextValue = {
  requestEntityPaste: (entity: PlatformAiEntityRef) => void
  consumePendingEntity: () => PlatformAiEntityRef | null
  /** Bumps on each paste request so consumers can react while the assistant stays open. */
  pasteVersion: number
}

const AiEntityPasteContext = createContext<AiEntityPasteContextValue | null>(null)

type AiEntityPasteProviderProps = {
  children: ReactNode
  onOpenAssistant: () => void
}

export function AiEntityPasteProvider({ children, onOpenAssistant }: AiEntityPasteProviderProps) {
  const pendingRef = useRef<PlatformAiEntityRef | null>(null)
  const [pasteVersion, setPasteVersion] = useState(0)

  const requestEntityPaste = useCallback(
    (entity: PlatformAiEntityRef) => {
      pendingRef.current = entity
      setPasteVersion((value) => value + 1)
      onOpenAssistant()
    },
    [onOpenAssistant],
  )

  const consumePendingEntity = useCallback(() => {
    const entity = pendingRef.current
    pendingRef.current = null
    return entity
  }, [])

  const value = useMemo(
    () => ({
      requestEntityPaste,
      consumePendingEntity,
      pasteVersion,
    }),
    [consumePendingEntity, pasteVersion, requestEntityPaste],
  )

  return <AiEntityPasteContext.Provider value={value}>{children}</AiEntityPasteContext.Provider>
}

export function useAiEntityPaste() {
  const context = useContext(AiEntityPasteContext)
  if (!context) {
    throw new Error('useAiEntityPaste must be used within AiEntityPasteProvider')
  }
  return context
}

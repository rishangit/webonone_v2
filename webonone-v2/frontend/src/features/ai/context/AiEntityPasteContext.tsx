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

export type AiEntityPasteRequest = {
  entities: PlatformAiEntityRef[]
  composerText?: string
}

type AiEntityPasteContextValue = {
  requestEntityPaste: (request: PlatformAiEntityRef | AiEntityPasteRequest) => void
  consumePendingEntity: () => AiEntityPasteRequest | null
  /** Bumps on each paste request so consumers can react while the assistant stays open. */
  pasteVersion: number
}

const AiEntityPasteContext = createContext<AiEntityPasteContextValue | null>(null)

function isPasteRequest(
  request: PlatformAiEntityRef | AiEntityPasteRequest,
): request is AiEntityPasteRequest {
  return 'entities' in request && Array.isArray(request.entities)
}

function normalizePasteRequest(
  request: PlatformAiEntityRef | AiEntityPasteRequest,
): AiEntityPasteRequest {
  if (isPasteRequest(request)) {
    return request
  }
  return { entities: [request] }
}

type AiEntityPasteProviderProps = {
  children: ReactNode
  onOpenAssistant: () => void
}

export function AiEntityPasteProvider({ children, onOpenAssistant }: AiEntityPasteProviderProps) {
  const pendingRef = useRef<AiEntityPasteRequest | null>(null)
  const [pasteVersion, setPasteVersion] = useState(0)

  const requestEntityPaste = useCallback(
    (request: PlatformAiEntityRef | AiEntityPasteRequest) => {
      pendingRef.current = normalizePasteRequest(request)
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

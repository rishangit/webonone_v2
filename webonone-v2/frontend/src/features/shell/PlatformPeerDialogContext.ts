import { createContext, useContext } from 'react'
import type {
  PlatformPeerDialogRequestMessage,
  PlatformPeerDialogResponder,
} from '@webonone/platform-embed'

export type PlatformPeerDialogContextValue = {
  openPeerDialog: (
    request: PlatformPeerDialogRequestMessage,
    responder: PlatformPeerDialogResponder,
    peerOrigin: string,
  ) => void
}

export const PlatformPeerDialogContext =
  createContext<PlatformPeerDialogContextValue | null>(null)

export function usePlatformPeerDialog(): PlatformPeerDialogContextValue {
  const context = useContext(PlatformPeerDialogContext)
  if (!context) {
    throw new Error('usePlatformPeerDialog must be used within PlatformPeerDialogProvider')
  }
  return context
}

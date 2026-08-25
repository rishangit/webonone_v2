import { createContext, useContext } from 'react'
import type {
  PlatformMediaDialogRequestMessage,
  PlatformMediaDialogResponder,
} from '@webonone/platform-embed'

export type PlatformMediaDialogContextValue = {
  openMediaDialog: (
    request: PlatformMediaDialogRequestMessage,
    responder: PlatformMediaDialogResponder,
  ) => void
  closeMediaDialog: (reason?: string) => void
}

export const PlatformMediaDialogContext =
  createContext<PlatformMediaDialogContextValue | null>(null)

export function usePlatformMediaDialog(): PlatformMediaDialogContextValue {
  const context = useContext(PlatformMediaDialogContext)
  if (!context) {
    throw new Error('usePlatformMediaDialog must be used within PlatformMediaDialogProvider')
  }
  return context
}

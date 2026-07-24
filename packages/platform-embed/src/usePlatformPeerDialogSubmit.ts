import { useEffect, useRef } from 'react'
import {
  isPlatformPeerDialogSecondaryMessage,
  isPlatformPeerDialogSubmitMessage,
} from './types'

export type UsePlatformPeerDialogSubmitOptions = {
  parentOrigin: string | null | undefined
  requestId: string | null | undefined
  onSubmit: () => void
  /** Host footer secondary (e.g. wizard Previous). */
  onSecondary?: () => void
}

/**
 * Embed dialog routes: listen for host footer Submit / Secondary → run local handlers.
 */
export function usePlatformPeerDialogSubmit({
  parentOrigin,
  requestId,
  onSubmit,
  onSecondary,
}: UsePlatformPeerDialogSubmitOptions): void {
  const onSubmitRef = useRef(onSubmit)
  const onSecondaryRef = useRef(onSecondary)

  useEffect(() => {
    onSubmitRef.current = onSubmit
    onSecondaryRef.current = onSecondary
  }, [onSecondary, onSubmit])

  useEffect(() => {
    if (!parentOrigin || !requestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      if (
        isPlatformPeerDialogSubmitMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        onSubmitRef.current()
        return
      }
      if (
        isPlatformPeerDialogSecondaryMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        onSecondaryRef.current?.()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin, requestId])
}

import { useEffect, useRef } from 'react'
import { isPlatformPeerDialogSubmitMessage } from './types'

export type UsePlatformPeerDialogSubmitOptions = {
  parentOrigin: string | null | undefined
  requestId: string | null | undefined
  onSubmit: () => void
}

/**
 * Embed dialog routes: listen for host footer Submit → run local form submit.
 */
export function usePlatformPeerDialogSubmit({
  parentOrigin,
  requestId,
  onSubmit,
}: UsePlatformPeerDialogSubmitOptions): void {
  const onSubmitRef = useRef(onSubmit)

  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  useEffect(() => {
    if (!parentOrigin || !requestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      if (
        !isPlatformPeerDialogSubmitMessage(event.data) ||
        event.data.requestId !== requestId
      ) {
        return
      }
      onSubmitRef.current()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin, requestId])
}

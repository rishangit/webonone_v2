import { useEffect } from 'react'
import { isPlatformInitMessage, PLATFORM_MESSAGE_TYPES } from './types'

type UsePlatformEmbedListenerOptions = {
  parentOrigin: string | null
  accessToken: string | null
  onInit?: (accessToken: string) => void
}

export function usePlatformEmbedListener({
  parentOrigin,
  accessToken,
  onInit,
}: UsePlatformEmbedListenerOptions): void {
  useEffect(() => {
    if (!parentOrigin) {
      return
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) {
        return
      }

      if (isPlatformInitMessage(event.data)) {
        onInit?.(event.data.accessToken)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onInit, parentOrigin])

  useEffect(() => {
    if (!parentOrigin || !accessToken) {
      return
    }

    window.parent.postMessage({ type: PLATFORM_MESSAGE_TYPES.READY }, parentOrigin)
  }, [accessToken, parentOrigin])
}

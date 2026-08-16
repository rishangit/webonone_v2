import { useLayoutEffect, useRef, useState } from 'react'
import { sendPlatformContentReady } from './embedUrl'

export type UsePlatformEmbedContentReadyOptions = {
  parentOrigin: string | null
  isContentReady: boolean
}

export type UsePlatformEmbedContentReadyResult = {
  /** True once the embed has emitted its first content-ready to the shell. */
  hasReported: boolean
}

/**
 * Embedded app -> parent shell: report first-page content-ready as soon as
 * `isContentReady` is true. No timer — hide the shell overlay when data is loaded.
 * The once-guard resets naturally on iframe reload.
 */
export function usePlatformEmbedContentReady({
  parentOrigin,
  isContentReady,
}: UsePlatformEmbedContentReadyOptions): UsePlatformEmbedContentReadyResult {
  const sentRef = useRef(false)
  const [hasReported, setHasReported] = useState(false)

  useLayoutEffect(() => {
    if (!parentOrigin || sentRef.current || !isContentReady) {
      return
    }
    sentRef.current = true
    sendPlatformContentReady(parentOrigin)
    setHasReported(true)
  }, [parentOrigin, isContentReady])

  return { hasReported }
}

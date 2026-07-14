import { useEffect, useRef, useState } from 'react'
import { sendPlatformContentReady } from './embedUrl'

export type UsePlatformEmbedContentReadyOptions = {
  parentOrigin: string | null
  isContentReady: boolean
  /** Continuous-ready settle before reporting, to absorb the post-paint mount gap. */
  settleMs?: number
}

export type UsePlatformEmbedContentReadyResult = {
  /** True once the embed has emitted its first content-ready to the shell. */
  hasReported: boolean
}

/**
 * Embedded app -> parent shell: report first-page content-ready once it has
 * stayed loaded for `settleMs`. The once-guard resets naturally on iframe reload.
 * Returns `hasReported` so the embed can defer its own overlay to the shell
 * during initial load and only paint it for later in-app loads.
 */
export function usePlatformEmbedContentReady({
  parentOrigin,
  isContentReady,
  settleMs = 250,
}: UsePlatformEmbedContentReadyOptions): UsePlatformEmbedContentReadyResult {
  const sentRef = useRef(false)
  const [hasReported, setHasReported] = useState(false)

  useEffect(() => {
    if (!parentOrigin || sentRef.current || !isContentReady) {
      return
    }

    const timer = window.setTimeout(() => {
      sentRef.current = true
      sendPlatformContentReady(parentOrigin)
      setHasReported(true)
    }, settleMs)

    return () => window.clearTimeout(timer)
  }, [parentOrigin, isContentReady, settleMs])

  return { hasReported }
}

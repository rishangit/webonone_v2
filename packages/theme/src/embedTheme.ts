import { useEffect } from 'react'
import { applyThemeVariables } from './applyTheme'
import { THEME_MESSAGE_TYPES } from './constants'
import { themePayloadSchema } from './urlTheme'
import type { ThemePayload } from './types'

export function broadcastThemeToIframes(
  payload: ThemePayload,
  iframes: HTMLIFrameElement[] | NodeListOf<HTMLIFrameElement>,
): void {
  const message = { type: THEME_MESSAGE_TYPES.APPLY, ...payload }

  for (const iframe of iframes) {
    if (!iframe.src || !iframe.contentWindow) continue
    try {
      const origin = new URL(iframe.src).origin
      iframe.contentWindow.postMessage(message, origin)
    } catch {
      // ignore invalid iframe src
    }
  }
}

export function useEmbedThemeListener(parentOrigin: string | null | undefined): void {
  useEffect(() => {
    if (!parentOrigin) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) return
      if (event.data?.type !== THEME_MESSAGE_TYPES.APPLY) return

      const parsed = themePayloadSchema.safeParse(event.data)
      if (!parsed.success) return

      applyThemeVariables(parsed.data)
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: THEME_MESSAGE_TYPES.READY }, parentOrigin)

    return () => window.removeEventListener('message', onMessage)
  }, [parentOrigin])
}

import { useEffect, useState } from 'react'
import {
  LIST_DISPLAY_MODE_CHANGE_EVENT,
  LIST_DISPLAY_MODE_MESSAGE_TYPES,
  type ListDisplayMode,
} from './listDisplayModeConstants'
import { persistListDisplayMode } from './listDisplayModeSession'
import { parseListDisplayMode, resolveListDisplayMode } from './listDisplayModeUrl'

export function broadcastListDisplayModeToIframes(
  mode: ListDisplayMode,
  iframes: HTMLIFrameElement[] | NodeListOf<HTMLIFrameElement>,
): void {
  const message = { type: LIST_DISPLAY_MODE_MESSAGE_TYPES.APPLY, listDisplayMode: mode }

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

export function useEmbedListDisplayModeListener(parentOrigin: string | null | undefined): void {
  useEffect(() => {
    if (!parentOrigin) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) return
      if (event.data?.type !== LIST_DISPLAY_MODE_MESSAGE_TYPES.APPLY) return

      const mode = parseListDisplayMode(event.data?.listDisplayMode)
      if (!mode) return

      persistListDisplayMode(mode)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [parentOrigin])
}

export function useListDisplayModeValue(parentOrigin?: string | null): ListDisplayMode {
  const [mode, setMode] = useState<ListDisplayMode>(() =>
    typeof window === 'undefined'
      ? 'list'
      : resolveListDisplayMode(new URLSearchParams(window.location.search)),
  )

  useEmbedListDisplayModeListener(parentOrigin)

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail
      const parsed = parseListDisplayMode(detail)
      if (parsed) setMode(parsed)
    }

    window.addEventListener(LIST_DISPLAY_MODE_CHANGE_EVENT, handle)
    return () => window.removeEventListener(LIST_DISPLAY_MODE_CHANGE_EVENT, handle)
  }, [])

  return mode
}

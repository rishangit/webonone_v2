import { useEffect, useState } from 'react'
import {
  LIST_PAGE_MODE_CHANGE_EVENT,
  LIST_PAGE_MODE_MESSAGE_TYPES,
  type ListPageMode,
} from './listPageModeConstants'
import { persistListPageMode } from './listPageModeSession'
import { parseListPageMode, resolveListPageMode } from './listPageModeUrl'

export function broadcastListPageModeToIframes(
  mode: ListPageMode,
  iframes: HTMLIFrameElement[] | NodeListOf<HTMLIFrameElement>,
): void {
  const message = { type: LIST_PAGE_MODE_MESSAGE_TYPES.APPLY, listPageMode: mode }

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

export function useEmbedListPageModeListener(parentOrigin: string | null | undefined): void {
  useEffect(() => {
    if (!parentOrigin) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) return
      if (event.data?.type !== LIST_PAGE_MODE_MESSAGE_TYPES.APPLY) return

      const mode = parseListPageMode(event.data?.listPageMode)
      if (!mode) return

      persistListPageMode(mode)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [parentOrigin])
}

export function useListPageModeValue(parentOrigin?: string | null): ListPageMode {
  const [mode, setMode] = useState<ListPageMode>(() =>
    typeof window === 'undefined'
      ? 'pagination'
      : resolveListPageMode(new URLSearchParams(window.location.search)),
  )

  useEmbedListPageModeListener(parentOrigin)

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail
      const parsed = parseListPageMode(detail)
      if (parsed) setMode(parsed)
    }

    window.addEventListener(LIST_PAGE_MODE_CHANGE_EVENT, handle)
    return () => window.removeEventListener(LIST_PAGE_MODE_CHANGE_EVENT, handle)
  }, [])

  return mode
}

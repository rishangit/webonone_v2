import { useEffect, useState } from 'react'
import { applyUiTheme } from './applyUiTheme'
import {
  UI_THEME_CHANGE_EVENT,
  UI_THEME_MESSAGE_TYPES,
  type UiThemeId,
} from './uiThemeConstants'
import { persistUiTheme } from './uiThemeSession'
import { parseUiTheme, resolveUiTheme } from './uiThemeUrl'

export function broadcastUiThemeToIframes(
  theme: UiThemeId,
  iframes: HTMLIFrameElement[] | NodeListOf<HTMLIFrameElement>,
): void {
  const message = { type: UI_THEME_MESSAGE_TYPES.APPLY, uiTheme: theme }

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

export function useEmbedUiThemeListener(parentOrigin: string | null | undefined): void {
  useEffect(() => {
    if (!parentOrigin) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) return
      if (event.data?.type !== UI_THEME_MESSAGE_TYPES.APPLY) return

      const theme = parseUiTheme(event.data?.uiTheme)
      if (!theme) return

      persistUiTheme(theme)
      applyUiTheme(theme)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [parentOrigin])
}

export function useUiThemeValue(parentOrigin?: string | null): UiThemeId {
  const [theme, setTheme] = useState<UiThemeId>(() =>
    typeof window === 'undefined'
      ? 'classic'
      : resolveUiTheme(new URLSearchParams(window.location.search)),
  )

  useEmbedUiThemeListener(parentOrigin)

  useEffect(() => {
    applyUiTheme(theme)
  }, [theme])

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail
      const parsed = parseUiTheme(detail)
      if (parsed) setTheme(parsed)
    }

    window.addEventListener(UI_THEME_CHANGE_EVENT, handle)
    return () => window.removeEventListener(UI_THEME_CHANGE_EVENT, handle)
  }, [])

  return theme
}

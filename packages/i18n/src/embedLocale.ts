import { useEffect } from 'react'
import { LOCALE_MESSAGE_TYPES, type AppLocale } from './constants'
import { getAppI18n } from './createAppI18n'
import { normalizeLocale, setStoredLocale } from './localeStorage'

export function broadcastLocaleToIframes(
  locale: AppLocale,
  iframes: HTMLIFrameElement[] | NodeListOf<HTMLIFrameElement>,
): void {
  const message = { type: LOCALE_MESSAGE_TYPES.APPLY, locale: normalizeLocale(locale) }

  for (const iframe of Array.from(iframes)) {
    if (!iframe.src || !iframe.contentWindow) continue
    try {
      const origin = new URL(iframe.src).origin
      iframe.contentWindow.postMessage(message, origin)
    } catch {
      // ignore invalid iframe src
    }
  }
}

export function useEmbedLocaleListener(parentOrigin: string | null | undefined): void {
  useEffect(() => {
    if (!parentOrigin) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) return
      if (event.data?.type !== LOCALE_MESSAGE_TYPES.APPLY) return

      const raw = event.data?.locale
      if (typeof raw !== 'string') return

      const locale = normalizeLocale(raw)
      setStoredLocale(locale)
      void getAppI18n().changeLanguage(locale)
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: LOCALE_MESSAGE_TYPES.READY }, parentOrigin)

    return () => window.removeEventListener('message', onMessage)
  }, [parentOrigin])
}

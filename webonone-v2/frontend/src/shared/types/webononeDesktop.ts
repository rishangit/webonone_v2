export interface WebOnOneDesktopBridge {
  retry: () => void
  appVersion?: string
}

export function getWebOnOneDesktopBridge(): WebOnOneDesktopBridge | null {
  if (typeof window === 'undefined') return null
  const bridge = (window as Window & { webononeDesktop?: WebOnOneDesktopBridge }).webononeDesktop
  return bridge ?? null
}

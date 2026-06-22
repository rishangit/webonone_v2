import { useEffect } from 'react'
import { applyThemeFromQueryParams, stripThemeQueryParams } from './urlTheme'

export function useRedirectThemeBootstrap(): void {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const payload = applyThemeFromQueryParams(search)
    if (!payload) return

    const stripped = stripThemeQueryParams(search)
    const query = stripped.toString()
    const next = query
      ? `${window.location.pathname}?${query}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`
    window.history.replaceState(null, '', next)
  }, [])
}

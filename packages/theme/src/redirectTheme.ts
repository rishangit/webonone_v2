import { useEffect } from 'react'
import { applyThemeFromQueryParams, stripThemeQueryParams } from './urlTheme'
import {
  applyListPageModeFromQueryParams,
  stripListPageModeQueryParams,
} from './listPageModeUrl'

export function useRedirectThemeBootstrap(): void {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    applyThemeFromQueryParams(search)
    applyListPageModeFromQueryParams(search)

    const stripped = stripListPageModeQueryParams(stripThemeQueryParams(search))
    const query = stripped.toString()
    const next = query
      ? `${window.location.pathname}?${query}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`
    window.history.replaceState(null, '', next)
  }, [])
}

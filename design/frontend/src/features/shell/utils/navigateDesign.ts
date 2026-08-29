import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformNavigate,
} from '@webonone/platform-embed'
import {
  appendThemeToUrl,
  isHexColor,
  parseThemeQueryParams,
  readPersistedTheme,
  relayListPageModeQueryParams,
  relayUiThemeQueryParams,
  type ThemePayload,
} from '@webonone/theme'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export function isWebsiteDesignerPath(pathname: string): boolean {
  return /^\/website\/(pages|headers|footers)\/[^/]+\/edit\/?$/.test(pathname)
}

/** Standalone Design origin URL — no embed query, so the tab is chromeless and full width. */
export function websiteDesignerUrl(kind: 'pages' | 'headers' | 'footers', id: string): string {
  let url = new URL(`${window.location.origin}/website/${kind}/${encodeURIComponent(id)}/edit`)
  const theme = appliedThemePayload()
  if (theme) {
    url = appendThemeToUrl(url, theme)
  }
  const listMode = relayListPageModeQueryParams(new URLSearchParams(window.location.search))
  const uiTheme = relayUiThemeQueryParams(new URLSearchParams(window.location.search))
  for (const [key, value] of Object.entries(listMode)) {
    url.searchParams.set(key, value)
  }
  for (const [key, value] of Object.entries(uiTheme)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

export function openWebsiteDesigner(kind: 'pages' | 'headers' | 'footers', id: string): void {
  const url = websiteDesignerUrl(kind, id)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * List/designer navigation that updates the WebOnOne shell URL when Design is
 * embedded. Navigate the peer SPA first and mark the shell message as
 * `clientNavigated` so the host syncs the address bar without reloading the iframe.
 */
export function useNavigateDesign() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  const goToList = useCallback(() => {
    navigate({ pathname: '/forms', search: searchParams.toString() })
    if (parentOrigin) {
      sendPlatformNavigate(parentOrigin, '/design/forms', { clientNavigated: true })
    }
  }, [navigate, parentOrigin, searchParams])

  const goToWebsite = useCallback(
    (path = '/website') => {
      const next = path.startsWith('/') ? path : `/${path}`
      navigate({ pathname: next, search: searchParams.toString() })
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/design${next}`, { clientNavigated: true })
      }
    },
    [navigate, parentOrigin, searchParams],
  )

  const goToWebsiteEdit = useCallback((kind: 'pages' | 'headers' | 'footers', id: string) => {
    openWebsiteDesigner(kind, id)
  }, [])

  const goToEdit = useCallback(
    (id: string) => {
      navigate({ pathname: `/forms/${id}/edit`, search: searchParams.toString() })
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, `/design/forms/${id}/edit`, { clientNavigated: true })
      }
    },
    [navigate, parentOrigin, searchParams],
  )

  const goToFill = useCallback(
    (id: string, query: Record<string, string>) => {
      const nextSearch = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(query)) {
        nextSearch.set(key, value)
      }
      const qs = new URLSearchParams(query).toString()
      const shellPath = `/design/forms/${id}/fill${qs ? `?${qs}` : ''}`
      navigate({ pathname: `/forms/${id}/fill`, search: nextSearch.toString() })
      if (parentOrigin) {
        sendPlatformNavigate(parentOrigin, shellPath, { clientNavigated: true })
      }
    },
    [navigate, parentOrigin, searchParams],
  )

  return { goToList, goToEdit, goToFill, goToWebsite, goToWebsiteEdit, isEmbedded: Boolean(parentOrigin) }
}

function appliedThemePayload(): ThemePayload | null {
  const fromQuery = parseThemeQueryParams(new URLSearchParams(window.location.search))
  if (fromQuery) return fromQuery
  const persisted = readPersistedTheme()
  if (persisted) return persisted
  return themePayloadFromDocument()
}

function themePayloadFromDocument(): ThemePayload | null {
  const style = getComputedStyle(document.documentElement)
  const colors = [1, 2, 3, 4, 5].map((slot) => {
    const raw = style.getPropertyValue(`--color-${slot}`).trim()
    return raw.startsWith('#') ? raw : `#${raw}`
  })
  if (!colors.every((value) => isHexColor(value))) return null
  return {
    version: 1,
    colorMode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    theme: {
      id: 'applied-theme',
      name: 'Applied theme',
      color1: colors[0]!,
      color2: colors[1]!,
      color3: colors[2]!,
      color4: colors[3]!,
      color5: colors[4]!,
    },
  }
}

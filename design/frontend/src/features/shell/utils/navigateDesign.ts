import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformNavigate,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export function isWebsiteDesignerPath(pathname: string): boolean {
  return /^\/website\/(pages|headers|footers)\/[^/]+\/edit\/?$/.test(pathname)
}

/** Standalone Design origin URL — no embed query, so the tab is chromeless and full width. */
export function websiteDesignerUrl(kind: 'pages' | 'headers' | 'footers', id: string): string {
  return `${window.location.origin}/website/${kind}/${encodeURIComponent(id)}/edit`
}

export function openWebsiteDesigner(kind: 'pages' | 'headers' | 'footers', id: string): void {
  const url = websiteDesignerUrl(kind, id)
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (opened) return
  const inEmbed = new URLSearchParams(window.location.search).has('embed')
  if (!inEmbed) window.location.assign(url)
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

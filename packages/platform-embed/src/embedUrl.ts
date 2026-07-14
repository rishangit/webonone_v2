import { PLATFORM_EMBED_QUERY, PLATFORM_MESSAGE_TYPES } from './types'
import type { BuildPlatformEmbedUrlOptions } from './types'

export function buildPlatformRedirectUri(peerOrigin: string, path = '/'): string {
  const base = peerOrigin.replace(/\/$/, '')
  const normalizedPath = path === '/' || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath === '/' ? '/' : normalizedPath}`
}

export function buildPlatformEmbedUrl({
  peerOrigin,
  path = '/',
  parentOrigin,
  scope = 'platform-nav',
  searchParams,
}: BuildPlatformEmbedUrlOptions): string {
  const base = peerOrigin.replace(/\/$/, '')
  const normalizedPath = path === '/' || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}${normalizedPath === '/' ? '/' : normalizedPath}`)

  url.searchParams.set(PLATFORM_EMBED_QUERY.EMBED, PLATFORM_EMBED_QUERY.EMBED_VALUE)
  url.searchParams.set(PLATFORM_EMBED_QUERY.PARENT_ORIGIN, parentOrigin)
  url.searchParams.set(PLATFORM_EMBED_QUERY.SCOPE, scope)

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

export function sendPlatformInit(
  iframe: HTMLIFrameElement,
  peerOrigin: string,
  accessToken: string,
): void {
  iframe.contentWindow?.postMessage(
    { type: PLATFORM_MESSAGE_TYPES.INIT, accessToken },
    peerOrigin,
  )
}

/** Embedded app -> parent shell: first page content is fully loaded. */
export function sendPlatformContentReady(parentOrigin: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.parent.postMessage({ type: PLATFORM_MESSAGE_TYPES.CONTENT_READY }, parentOrigin)
}

export function isPlatformEmbedMode(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): boolean {
  if (searchParams.get(PLATFORM_EMBED_QUERY.EMBED) !== PLATFORM_EMBED_QUERY.EMBED_VALUE) {
    return false
  }

  const parentOrigin = searchParams.get(PLATFORM_EMBED_QUERY.PARENT_ORIGIN)
  return Boolean(parentOrigin && isAllowedParentOrigin(parentOrigin))
}

export function getPlatformEmbedParentOrigin(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): string | null {
  if (!isPlatformEmbedMode(searchParams, isAllowedParentOrigin)) {
    return null
  }

  return searchParams.get(PLATFORM_EMBED_QUERY.PARENT_ORIGIN)
}

/** True when loaded as a platform embed iframe (auth via postMessage, not auth-code). */
export function hasPlatformEmbedHandoff(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): boolean {
  return isPlatformEmbedMode(searchParams, isAllowedParentOrigin)
}

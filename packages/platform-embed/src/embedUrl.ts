import { PLATFORM_EMBED_QUERY } from './types'
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
    { type: 'webonone:platform:init', accessToken },
    peerOrigin,
  )
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

export function hasPlatformEmbedHandoff(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): boolean {
  const code = searchParams.get('code')
  return Boolean(code && !searchParams.get('state') && isPlatformEmbedMode(searchParams, isAllowedParentOrigin))
}

import { getPlatformEmbedParentOrigin } from './embedUrl'
import { PLATFORM_EMBED_QUERY } from './types'

const EMBED_SESSION_KEY = 'webonone:platform-embed-session'

export type PlatformEmbedSession = {
  parentOrigin: string
  scope?: string
}

function readPlatformEmbedSession(): PlatformEmbedSession | null {
  try {
    const raw = sessionStorage.getItem(EMBED_SESSION_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as PlatformEmbedSession
    if (!parsed.parentOrigin) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writePlatformEmbedSession(session: PlatformEmbedSession): void {
  try {
    sessionStorage.setItem(EMBED_SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore storage errors
  }
}

/** Persist embed session from URL before React mounts (main.tsx). */
export function persistPlatformEmbedSessionFromUrl(): void {
  if (typeof window === 'undefined') {
    return
  }

  const params = new URLSearchParams(window.location.search)
  const parentOrigin = params.get(PLATFORM_EMBED_QUERY.PARENT_ORIGIN)
  if (
    params.get(PLATFORM_EMBED_QUERY.EMBED) !== PLATFORM_EMBED_QUERY.EMBED_VALUE ||
    !parentOrigin
  ) {
    return
  }

  writePlatformEmbedSession({
    parentOrigin,
    scope: params.get(PLATFORM_EMBED_QUERY.SCOPE) ?? undefined,
  })
}

export function clearPlatformEmbedSession(): void {
  try {
    sessionStorage.removeItem(EMBED_SESSION_KEY)
  } catch {
    // ignore storage errors
  }
}

/** URL embed params, or persisted session while running inside a parent iframe. */
export function resolvePlatformEmbedParentOrigin(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): string | null {
  const fromUrl = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  if (fromUrl) {
    writePlatformEmbedSession({
      parentOrigin: fromUrl,
      scope: searchParams.get(PLATFORM_EMBED_QUERY.SCOPE) ?? undefined,
    })
    return fromUrl
  }

  const inIframe = typeof window !== 'undefined' && window.self !== window.top
  if (inIframe) {
    const session = readPlatformEmbedSession()
    if (session && isAllowedParentOrigin(session.parentOrigin)) {
      return session.parentOrigin
    }
  }

  clearPlatformEmbedSession()
  return null
}

export function isPlatformEmbedContext(
  searchParams: URLSearchParams,
  isAllowedParentOrigin: (origin: string) => boolean,
): boolean {
  return Boolean(resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin))
}

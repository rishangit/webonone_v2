const STALE_LOCAL_FILE =
  /^(https?:\/\/)(?:localhost|127\.0\.0\.1):4003(\/api\/v1\/files\/)/i

/** Media local API moved from :4003 to :4013. Rebuild stale file URLs onto the current port. */
export function rewriteMediaFileUrl(url: string): string {
  return url.replace(STALE_LOCAL_FILE, 'http://127.0.0.1:4013$2')
}

export function rewriteOptionalMediaFileUrl(url: string | null | undefined): string | null {
  if (url == null || url === '') {
    return null
  }
  return rewriteMediaFileUrl(url)
}

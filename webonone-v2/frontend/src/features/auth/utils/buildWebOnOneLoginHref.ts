import { QUERY } from '@webonone/platform-nav'
import { storeLoginReturnPath } from '@/features/auth/utils/loginReturnPath'

export type BuildWebOnOneLoginHrefOptions = {
  /** When true, force Identity account chooser and skip silent SSO (logout / switch account). */
  promptLogin?: boolean
}

/**
 * Build WebOnOne `/login` query.
 * Default omits `prompt=login` so Identity silent SSO can run (route guards, Open App).
 * Pass `{ promptLogin: true }` for logout / explicit re-auth.
 */
export function buildWebOnOneLoginSearch(
  returnPath?: string,
  options?: BuildWebOnOneLoginHrefOptions,
): string {
  const params = new URLSearchParams()
  if (options?.promptLogin) {
    params.set('prompt', 'login')
  }
  const path = returnPath?.trim()
  if (path) {
    storeLoginReturnPath(path)
    params.set(QUERY.RETURN_PATH, path)
  }
  return params.toString()
}

export function buildWebOnOneLoginHref(
  returnPath?: string,
  options?: BuildWebOnOneLoginHrefOptions,
): string {
  const search = buildWebOnOneLoginSearch(returnPath, options)
  return search ? `/login?${search}` : '/login'
}

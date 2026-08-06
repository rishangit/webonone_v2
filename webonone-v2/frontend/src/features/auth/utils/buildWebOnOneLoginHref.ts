import { QUERY } from '@webonone/platform-nav'
import { storeLoginReturnPath } from '@/features/auth/utils/loginReturnPath'

/**
 * Build WebOnOne `/login` query for intentional sign-in.
 * Always includes `prompt=login` so Identity clears the embed partition and shows the chooser.
 */
export function buildWebOnOneLoginSearch(returnPath?: string): string {
  const params = new URLSearchParams()
  params.set('prompt', 'login')
  const path = returnPath?.trim()
  if (path) {
    storeLoginReturnPath(path)
    params.set(QUERY.RETURN_PATH, path)
  }
  return params.toString()
}

export function buildWebOnOneLoginHref(returnPath?: string): string {
  return `/login?${buildWebOnOneLoginSearch(returnPath)}`
}

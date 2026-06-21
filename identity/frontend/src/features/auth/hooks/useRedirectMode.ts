import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAllowedRedirectUri } from '../utils/redirectAllowlist'

export function useRedirectMode() {
  const [searchParams] = useSearchParams()
  const redirectUri = searchParams.get('redirect_uri')
  const returnPath = searchParams.get('return_path') ?? '/'
  const state = searchParams.get('state')

  return useMemo(() => {
    const isRedirect = Boolean(redirectUri && isAllowedRedirectUri(redirectUri))
    return {
      isRedirect,
      redirectUri: isRedirect ? redirectUri! : null,
      returnPath,
      state,
    }
  }, [redirectUri, returnPath, state])
}

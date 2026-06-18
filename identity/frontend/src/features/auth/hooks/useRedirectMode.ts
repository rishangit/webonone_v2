import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const ALLOWED_REDIRECT_URIS = (
  import.meta.env.VITE_ALLOWED_REDIRECT_URIS ?? 'http://localhost:3000/callback'
)
  .split(',')
  .map((uri: string) => uri.trim())
  .filter(Boolean)

function isAllowedRedirectUri(redirectUri: string): boolean {
  return ALLOWED_REDIRECT_URIS.includes(redirectUri)
}

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

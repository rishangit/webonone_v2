import { useEffect, useState } from 'react'
import { exchangeAuthCode, type ExchangeAuthCodeResult } from './exchangeAuthCode'
import { stripAuthCodeFromSearch } from './returnUrl'

export type UsePlatformRedirectBootstrapOptions = {
  code: string | null
  isRedirectHandoff: boolean
  pathname: string
  searchParams: URLSearchParams
  identityApiBase: string
  getRedirectUri: (pathname: string) => string
  onSuccess: (result: ExchangeAuthCodeResult) => void | Promise<void>
  navigate: (to: { pathname: string; search: string }, options?: { replace?: boolean }) => void
}

export type PlatformRedirectBootstrapState = {
  isBootstrapping: boolean
  bootstrapError: string | null
}

const exchangedRedirectCodes = new Set<string>()

export function usePlatformRedirectBootstrap({
  code,
  isRedirectHandoff,
  pathname,
  searchParams,
  identityApiBase,
  getRedirectUri,
  onSuccess,
  navigate,
}: UsePlatformRedirectBootstrapOptions): PlatformRedirectBootstrapState {
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(code && isRedirectHandoff))

  useEffect(() => {
    if (!code || !isRedirectHandoff) {
      setIsBootstrapping(false)
      return
    }

    if (exchangedRedirectCodes.has(code)) {
      setIsBootstrapping(false)
      return
    }

    exchangedRedirectCodes.add(code)
    setIsBootstrapping(true)
    setBootstrapError(null)

    const redirectUri = getRedirectUri(pathname)

    exchangeAuthCode({ identityApiBase, code, redirectUri })
      .then(async (result) => {
        await onSuccess(result)
        navigate(
          { pathname, search: stripAuthCodeFromSearch(searchParams) },
          { replace: true },
        )
      })
      .catch((err: Error) => {
        exchangedRedirectCodes.delete(code)
        setBootstrapError(err.message)
      })
      .finally(() => {
        setIsBootstrapping(false)
      })
  }, [
    code,
    getRedirectUri,
    identityApiBase,
    isRedirectHandoff,
    navigate,
    onSuccess,
    pathname,
    searchParams,
  ])

  return {
    isBootstrapping: isRedirectHandoff && isBootstrapping,
    bootstrapError: isRedirectHandoff ? bootstrapError : null,
  }
}

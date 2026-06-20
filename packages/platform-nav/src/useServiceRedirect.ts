import { useCallback, useState } from 'react'
import { redirectWithAuthCode } from './authCodeRedirect'
import type { RedirectWithAuthCodeOptions } from './types'

export function useServiceRedirect() {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const redirect = useCallback(async (opts: RedirectWithAuthCodeOptions) => {
    setIsRedirecting(true)
    setError(null)
    try {
      await redirectWithAuthCode(opts)
    } catch (err) {
      setIsRedirecting(false)
      setError(err instanceof Error ? err.message : 'Redirect failed')
      throw err
    }
  }, [])

  return { redirect, isRedirecting, error, clearError }
}

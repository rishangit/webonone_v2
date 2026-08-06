import { useLayoutEffect, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { QUERY, parseCoreReturnPath } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { IdentityLoginFrame } from '../components/IdentityLoginFrame'
import { WebsiteReturnRedirect } from '../components/WebsiteReturnRedirect'
import { useIdentitySilentSso } from '../hooks/useIdentitySilentSso'
import { authActions, clearWebOnOneAuthStorage } from '../store/authSlice'
import { parseWebsiteReturnUrl } from '../utils/websiteConfig'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const clearedPromptRef = useRef(false)
  const promptLogin = searchParams.get('prompt') === 'login'
  const websiteReturnUrl = parseWebsiteReturnUrl(searchParams.get(QUERY.RETURN_URL))
  const coreReturnPath =
    parseCoreReturnPath(searchParams.get(QUERY.RETURN_PATH)) ??
    parseCoreReturnPath(searchParams.get('returnPath'))
  const returnPath = coreReturnPath ?? '/'
  const { isChecking, iframeSrc } = useIdentitySilentSso()

  // Satellite / Identity logout lands on `/login?prompt=login` — clear core JWT so
  // we do not bounce straight back into the authenticated shell.
  useLayoutEffect(() => {
    if (!promptLogin || clearedPromptRef.current) {
      return
    }
    clearedPromptRef.current = true
    clearWebOnOneAuthStorage()
    dispatch(authActions.logout())
  }, [dispatch, promptLogin])

  if (accessToken && !promptLogin) {
    if (websiteReturnUrl) {
      return <WebsiteReturnRedirect accessToken={accessToken} returnUrl={websiteReturnUrl} />
    }
    if (coreReturnPath) {
      return <Navigate to={coreReturnPath} replace />
    }
    return <Navigate to="/" replace />
  }

  // Silent Identity SSO in progress — avoid flashing the login iframe.
  if (!promptLogin && isChecking) {
    return (
      <div className="flex h-dvh min-h-0 w-full flex-col items-center justify-center overflow-hidden">
        {iframeSrc ? (
          <iframe
            title="Identity silent SSO"
            src={iframeSrc}
            aria-hidden
            tabIndex={-1}
            className="pointer-events-none fixed h-0 w-0 border-0 opacity-0"
          />
        ) : null}
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    )
  }

  // No PageShell — Identity iframe owns the auth chrome; avoid double headers.
  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
      <IdentityLoginFrame returnPath={returnPath} websiteReturnUrl={websiteReturnUrl} />
    </div>
  )
}

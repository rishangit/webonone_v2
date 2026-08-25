import { useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QUERY, parseCoreReturnPath } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { GuestAuthLayout } from '../components/GuestAuthLayout'
import { IdentityLoginFrame } from '../components/IdentityLoginFrame'
import { WebsiteReturnRedirect } from '../components/WebsiteReturnRedirect'
import { useIdentitySilentSso } from '../hooks/useIdentitySilentSso'
import { authActions, clearWebOnOneAuthStorage } from '../store/authSlice'
import { clearLoginReturnPath, peekLoginReturnPath } from '../utils/loginReturnPath'
import { isIdentityGuestAuthPath } from '../utils/identityConfig'
import { resolveWebsiteReturnTarget } from '../utils/websiteConfig'

const LOG = '[webonone-auth]'

export function IdentityAuthPage() {
  const { t } = useTranslation('auth')
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const clearedPromptRef = useRef(false)
  const promptLogin = searchParams.get('prompt') === 'login'
  const isLoginRoute = location.pathname === '/login'
  const identityPath = isIdentityGuestAuthPath(location.pathname) ? location.pathname : '/login'
  const { websiteReturnUrl } = resolveWebsiteReturnTarget(searchParams.get(QUERY.RETURN_URL))
  const queryReturnPath =
    parseCoreReturnPath(searchParams.get(QUERY.RETURN_PATH)) ??
    parseCoreReturnPath(searchParams.get('returnPath'))
  const coreReturnPath = queryReturnPath ?? peekLoginReturnPath()
  const returnPath = coreReturnPath ?? '/'
  const { isChecking, iframeSrc } = useIdentitySilentSso({
    enabled: isLoginRoute && !accessToken && !promptLogin,
  })

  useLayoutEffect(() => {
    if (!isLoginRoute || !promptLogin || clearedPromptRef.current) {
      return
    }
    clearedPromptRef.current = true
    console.log(LOG, 'login page prompt=login → clear local session')
    clearWebOnOneAuthStorage()
    dispatch(authActions.logout())
  }, [dispatch, isLoginRoute, promptLogin])

  useEffect(() => {
    console.log(LOG, 'auth page state', {
      path: location.pathname,
      hasToken: Boolean(accessToken),
      promptLogin,
      identityChecking: isChecking,
      websiteReturnUrl: Boolean(websiteReturnUrl),
      returnPath,
    })
  }, [accessToken, isChecking, location.pathname, promptLogin, returnPath, websiteReturnUrl])

  if (accessToken && promptLogin && clearedPromptRef.current) {
    clearLoginReturnPath()
    if (websiteReturnUrl) {
      return <WebsiteReturnRedirect accessToken={accessToken} returnUrl={websiteReturnUrl} />
    }
    return <Navigate to={returnPath} replace />
  }

  if (accessToken && !promptLogin) {
    if (websiteReturnUrl) {
      clearLoginReturnPath()
      return <WebsiteReturnRedirect accessToken={accessToken} returnUrl={websiteReturnUrl} />
    }
    if (coreReturnPath) {
      clearLoginReturnPath()
      return <Navigate to={coreReturnPath} replace />
    }
    clearLoginReturnPath()
    return <Navigate to="/" replace />
  }

  if (isLoginRoute && !promptLogin && isChecking) {
    return (
      <GuestAuthLayout>
        <div className="flex flex-1 flex-col items-center justify-center">
          {iframeSrc ? (
            <iframe
              title={t('silentSso.iframeTitle')}
              src={iframeSrc}
              aria-hidden
              tabIndex={-1}
              className="pointer-events-none fixed h-0 w-0 border-0 opacity-0"
            />
          ) : null}
          <p className="text-sm text-muted-foreground">{t('silentSso.checkingSession')}</p>
        </div>
      </GuestAuthLayout>
    )
  }

  return (
    <GuestAuthLayout>
      <IdentityLoginFrame
        identityPath={identityPath}
        returnPath={returnPath}
        websiteReturnUrl={websiteReturnUrl}
      />
    </GuestAuthLayout>
  )
}

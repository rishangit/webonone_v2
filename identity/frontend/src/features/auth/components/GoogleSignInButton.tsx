import { useEffect, useRef, useState } from 'react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { Button } from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
/** GIS Sign in with Google buttons cap at 400px; we scale to match Sign in width. */
const GIS_MAX_WIDTH = 400

function GoogleGIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function GoogleSignInButton() {
  const { t, i18n } = useTranslation('auth')
  const dispatch = useAppDispatch()
  const hostRef = useRef<HTMLDivElement>(null)
  const [hostWidth, setHostWidth] = useState(0)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const update = () => setHostWidth(Math.floor(el.getBoundingClientRect().width))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!GOOGLE_CLIENT_ID) {
    return null
  }

  function handleSuccess(response: CredentialResponse) {
    if (!response.credential) return
    dispatch(authActions.clearAuthError())
    dispatch(authActions.googleLoginRequested({ idToken: response.credential }))
  }

  const gisWidth = Math.min(Math.max(hostWidth, 200), GIS_MAX_WIDTH)
  const scaleX = hostWidth > 0 ? hostWidth / gisWidth : 1

  return (
    <div ref={hostRef} className="relative h-10 w-full">
      <Button
        type="button"
        variant="outline"
        className="pointer-events-none w-full bg-white text-neutral-900 hover:bg-white hover:text-neutral-900"
        tabIndex={-1}
        aria-hidden
      >
        <GoogleGIcon />
        {t('continueWithGoogle')}
      </Button>
      <div className="absolute inset-0 z-10 overflow-hidden opacity-0">
        {hostWidth > 0 ? (
          <div className="origin-top-left" style={{ width: gisWidth, transform: `scaleX(${scaleX})` }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => dispatch(authActions.loginFailed(t('googleSignInFailed')))}
              useOneTap={false}
              theme="outline"
              size="large"
              shape="rectangular"
              width={String(gisWidth)}
              text="continue_with"
              locale={i18n.language.startsWith('si') ? 'si' : 'en'}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

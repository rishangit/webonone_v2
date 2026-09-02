import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout, FeaturePage } from '@webonone/ui-kit'
import { decodeJwtPayload, sendAuthSuccess } from '@webonone/platform-embed'
import { useEmbedThemeListener } from '@webonone/theme'
import { useAppSelector } from '@/app/store/hooks'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { LoginForm } from '../components/LoginForm'
import { EmbedAuthLink } from '../components/EmbedAuthLink'
import { EmbedLoginChrome } from '../components/EmbedLoginChrome'
import { useEmbedLoginMode } from '../hooks/useEmbedLoginMode'
import { usePromptLoginSessionClear } from '../hooks/usePromptLoginSessionClear'
import { useRedirectMode } from '../hooks/useRedirectMode'
import { completeAuthRedirect } from '../utils/completeAuthRedirect'
import { withRedirectQuery } from '../utils/redirectQuery'

function resolveExpiresIn(accessToken: string): number {
  const claims = decodeJwtPayload(accessToken)
  if (claims?.exp) {
    return Math.max(0, claims.exp - Math.floor(Date.now() / 1000))
  }
  return 900
}

export function LoginPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const { isRedirect, redirectUri, state } = useRedirectMode()
  const { isEmbed, parentOrigin } = useEmbedLoginMode()
  const { accessToken, user, isLoading, error } = useAppSelector((s) => s.auth)
  const handledRef = useRef(false)
  const promptLogin = searchParams.get('prompt') === 'login'
  const freshLoginAllowedRef = useRef(!promptLogin)
  const wasLoadingRef = useRef(false)

  usePromptLoginSessionClear()
  useEmbedThemeListener(isEmbed ? parentOrigin : null)

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && accessToken && user) {
      freshLoginAllowedRef.current = true
    }
    wasLoadingRef.current = isLoading
  }, [accessToken, isLoading, user])

  useEffect(() => {
    if (handledRef.current || isLoading || !accessToken || !user) return
    if (!freshLoginAllowedRef.current) return

    // Embed wins over redirect when framed with allowlisted parentOrigin.
    if (isEmbed && parentOrigin) {
      handledRef.current = true
      sendAuthSuccess(parentOrigin, {
        accessToken,
        expiresIn: resolveExpiresIn(accessToken),
        user: {
          id: user.id,
          email: user.email ?? '',
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          locale: user.locale,
        },
      })
      return
    }

    if (isRedirect && redirectUri && state) {
      handledRef.current = true
      completeAuthRedirect(accessToken, redirectUri, state).catch(() => {
        handledRef.current = false
      })
    }
  }, [
    accessToken,
    user,
    isLoading,
    isEmbed,
    parentOrigin,
    isRedirect,
    redirectUri,
    state,
  ])

  const registerLink = withRedirectQuery('/register', searchParams)
  const forgotLink = withRedirectQuery('/forgot-password', searchParams)

  if (!isRedirect && !isEmbed && accessToken && user) {
    return (
      <FeaturePage
        title={t('welcome', { name: user.displayName })}
        description={t('youAreSignedIn')}
      >
        <p className="text-sm text-muted-foreground">
          <Link to="/profile" className="text-primary underline-offset-4 hover:underline">
            {t('viewYourProfile')}
          </Link>
        </p>
      </FeaturePage>
    )
  }

  const handoffInProgress =
    (isEmbed || isRedirect) &&
    Boolean(accessToken && user && freshLoginAllowedRef.current)

  const loginCard = (
    <AuthLayout
      title={t('signIn')}
      description={t('signInDescription')}
      variant="minimal"
      footer={
        isEmbed ? (
          <EmbedAuthLink to={forgotLink} className="text-primary underline-offset-4 hover:underline">
            {t('forgotPasswordLink')}
          </EmbedAuthLink>
        ) : (
          <span>
            <EmbedAuthLink to={registerLink} className="text-primary underline-offset-4 hover:underline">
              {t('createAccount')}
            </EmbedAuthLink>
            {' · '}
            <EmbedAuthLink to={forgotLink} className="text-primary underline-offset-4 hover:underline">
              {t('forgotPasswordLink')}
            </EmbedAuthLink>
          </span>
        )
      }
    >
      <div className="space-y-4">
        <GoogleSignInButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t('orContinueWithEmail')}</span>
          </div>
        </div>
        <LoginForm />
      </div>
      {handoffInProgress ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('signedInAs', { name: user!.displayName })}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-center text-sm text-destructive">{error}</p> : null}
    </AuthLayout>
  )

  if (isEmbed) {
    return <EmbedLoginChrome registerLink={registerLink}>{loginCard}</EmbedLoginChrome>
  }

  return loginCard
}

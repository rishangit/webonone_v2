import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Button, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import type { UserProfile } from '@/shared/types/auth.types'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { exchangeAuthCode } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getIdentityProfileRedirectUri } from '../utils/profileConfig'
import { buildProfileSearchWithoutCode, parseProfileReturnUrl } from '../utils/profileReturn'
import type { ProfileWizardStep } from '../schemas/profileSchemas'
import { ProfileFormDialog } from '../components/ProfileFormDialog'
import { ProfileView } from '../components/ProfileView'
import {
  VerifyContactOtpDialog,
  type VerifyContactChannel,
} from '../components/VerifyContactOtpDialog'

export function ProfilePage() {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken, user, isProfileLoading, profileError, profileSaveSuccess } = useAppSelector(
    (s) => s.auth,
  )
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [dialog, setDialog] = useState<{ initialStep: ProfileWizardStep } | null>(null)
  const [verifyChannel, setVerifyChannel] = useState<VerifyContactChannel | null>(null)
  const bootstrapRef = useRef(false)

  const code = searchParams.get('code')
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)
  const returnUrl = parseProfileReturnUrl(searchParams)

  const showProfileLoading =
    isProfileLoading &&
    (!user ||
      (!user.firstName && !user.lastName && user.displayName === user.email))

  usePlatformLoading(
    isBootstrapping
      ? t('loadingYour')
      : showProfileLoading
        ? t('loading')
        : null,
  )

  useEffect(() => {
    if (!code || isEmbedHandoff || bootstrapRef.current) return
    bootstrapRef.current = true
    setIsBootstrapping(true)
    setBootstrapError(null)

    exchangeAuthCode({
      identityApiBase: getIdentityApiBase(),
      code,
      redirectUri: getIdentityProfileRedirectUri(),
    })
      .then((result) => {
        dispatch(
          authActions.loginSucceeded({
            accessToken: result.accessToken,
            user: result.user as UserProfile,
          }),
        )
        navigate(
          { pathname: '/profile', search: buildProfileSearchWithoutCode(searchParams) },
          { replace: true },
        )
      })
      .catch((err: Error) => {
        bootstrapRef.current = false
        setBootstrapError(err.message)
      })
      .finally(() => {
        setIsBootstrapping(false)
      })
  }, [code, dispatch, isEmbedHandoff, navigate, searchParams])

  useEffect(() => {
    if (accessToken && !code) {
      // Always load `/auth/me` — embed may have seeded a JWT-only stub user.
      dispatch(authActions.profileFetchRequested({ force: true }))
    }
  }, [accessToken, code, dispatch])

  useEffect(() => {
    if (profileSaveSuccess) {
      const timer = window.setTimeout(() => {
        dispatch(authActions.clearProfileSaveSuccess())
      }, 3000)
      return () => window.clearTimeout(timer)
    }
  }, [profileSaveSuccess, dispatch])

  function handleBack() {
    if (returnUrl) {
      window.location.assign(returnUrl)
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/', { replace: true })
  }

  function openWizard(initialStep: ProfileWizardStep) {
    setDialog({ initialStep })
  }

  if (isBootstrapping) {
    return null
  }

  if (bootstrapError) {
    return (
      <FeaturePage
        title={t('pageTitle')}
        description={t('pageDescription')}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {tc('back')}
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{bootstrapError}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!accessToken && !code && !isEmbedHandoff) {
    return <Navigate to="/login" replace />
  }

  if (isEmbedHandoff && !accessToken) {
    return null
  }

  if (isProfileLoading && !user) {
    return null
  }

  if (!user) {
    return (
      <FeaturePage
        title={t('pageTitle')}
        description={t('pageDescription')}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {tc('back')}
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{profileError ?? t('unableToLoad')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={t('pageTitle')}
      description={t('pageDescription')}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {tc('back')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {profileError ? (
          <Alert variant="destructive">
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        ) : null}
        {profileSaveSuccess ? (
          <Alert>
            <AlertDescription>{t('savedSuccess')}</AlertDescription>
          </Alert>
        ) : null}
        <ProfileView
          user={user}
          avatarUrl={user.avatarUrl}
          onEditSection={openWizard}
          onVerifyEmail={() => setVerifyChannel('email')}
          onVerifyPhone={() => setVerifyChannel('phone')}
        />
      </div>

      {dialog ? (
        <ProfileFormDialog
          open
          initialStep={dialog.initialStep}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => {
            setDialog(null)
          }}
        />
      ) : null}

      {verifyChannel ? (
        <VerifyContactOtpDialog
          open
          channel={verifyChannel}
          contactHint={
            verifyChannel === 'email'
              ? (user.email?.trim() || t('verify.contactHintEmail'))
              : (user.phoneNumber?.trim() || t('verify.contactHintPhone'))
          }
          onOpenChange={(open) => {
            if (!open) setVerifyChannel(null)
          }}
          onVerified={() => {
            setVerifyChannel(null)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

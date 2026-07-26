import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken, user, isProfileLoading, profileError, profileSaveSuccess } = useAppSelector(
    (s) => s.auth,
  )
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [dialog, setDialog] = useState<{ initialStep: ProfileWizardStep } | null>(null)
  const bootstrapRef = useRef(false)

  const code = searchParams.get('code')
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)
  const returnUrl = parseProfileReturnUrl(searchParams)

  usePlatformLoading(
    isBootstrapping
      ? 'Loading your profile…'
      : isProfileLoading && !user
        ? 'Loading profile…'
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
    if (accessToken && !code && !user) {
      dispatch(authActions.profileFetchRequested())
    }
  }, [accessToken, code, dispatch, user])

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
        title="Profile"
        description="Your account details."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
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
        title="Profile"
        description="Your account details."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{profileError ?? 'Unable to load profile'}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title="Profile"
      description="Your account details."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
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
            <AlertDescription>Profile saved successfully.</AlertDescription>
          </Alert>
        ) : null}
        <ProfileView user={user} avatarUrl={user.avatarUrl} onEditSection={openWizard} />
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
    </FeaturePage>
  )
}

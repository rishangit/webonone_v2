import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Edit3 } from 'lucide-react'
import { Alert, AlertDescription, Button, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import type { UserProfile } from '@/shared/types/auth.types'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { ProfileForm, PROFILE_FORM_ID } from '../components/ProfileForm'
import { exchangeAuthCode } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getIdentityProfileRedirectUri } from '../utils/profileConfig'
import { buildProfileSearchWithoutCode, parseProfileReturnUrl } from '../utils/profileReturn'

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken, user, isProfileLoading, profileError, isProfileSaving, profileSaveSuccess } =
    useAppSelector((s) => s.auth)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
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
      setMode('view')
    }
  }, [profileSaveSuccess])

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
          {mode === 'view' ? (
            <Button type="button" size="sm" onClick={() => setMode('edit')}>
              <Edit3 className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMode('view')}
                disabled={isProfileSaving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" form={PROFILE_FORM_ID} disabled={isProfileSaving}>
                {isProfileSaving ? 'Saving…' : 'Save'}
              </Button>
            </>
          )}
        </div>
      }
    >
      <ProfileForm user={user} mode={mode} />
    </FeaturePage>
  )
}

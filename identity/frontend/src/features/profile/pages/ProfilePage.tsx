import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import type { UserProfile } from '@/shared/types/auth.types'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { ProfileForm } from '../components/ProfileForm'
import { exchangeAuthCode } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getIdentityProfileRedirectUri } from '../utils/profileConfig'
import { buildProfileSearchWithoutCode } from '../utils/profileReturn'

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken, user, isProfileLoading, profileError } = useAppSelector((s) => s.auth)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const bootstrapRef = useRef(false)

  const code = searchParams.get('code')
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)

  usePlatformLoading(isBootstrapping ? 'Loading your profile…' : isProfileLoading && !user ? 'Loading profile…' : null)

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

  if (isBootstrapping) {
    return null
  }

  if (bootstrapError) {
    return (
      <FeaturePage title="Profile" description="Your account details.">
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
      <FeaturePage title="Profile" description="Your account details.">
        <Alert variant="destructive">
          <AlertDescription>{profileError ?? 'Unable to load profile'}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage title="Profile" description="Your account details.">
      <ProfileForm user={user} />
    </FeaturePage>
  )
}


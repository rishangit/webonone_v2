import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, LoadingState } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import { ProfileForm } from '../components/ProfileForm'
import { bootstrapProfileSession } from '../utils/bootstrapProfileSession'
import {
  buildProfileSearchWithoutCode,
} from '../utils/profileReturn'

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken, user, isProfileLoading, profileError } = useAppSelector((s) => s.auth)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const bootstrapRef = useRef(false)

  const code = searchParams.get('code')

  useEffect(() => {
    if (!code || bootstrapRef.current) return
    bootstrapRef.current = true
    setIsBootstrapping(true)
    setBootstrapError(null)

    bootstrapProfileSession(code)
      .then((result) => {
        dispatch(
          authActions.loginSucceeded({
            accessToken: result.accessToken,
            user: result.user,
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
  }, [code, dispatch, navigate, searchParams])

  useEffect(() => {
    if (accessToken && !code) {
      dispatch(authActions.profileFetchRequested({ accessToken }))
    }
  }, [accessToken, code, dispatch])

  if (isBootstrapping) {
    return <LoadingState label="Loading your profile…" />
  }

  if (bootstrapError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{bootstrapError}</AlertDescription>
      </Alert>
    )
  }

  if (!accessToken && !code) {
    return <Navigate to="/login" replace />
  }

  if (isProfileLoading && !user) {
    return <LoadingState label="Loading profile…" />
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{profileError ?? 'Unable to load profile'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details.</p>
      </div>
      <ProfileForm user={user} />
    </div>
  )
}

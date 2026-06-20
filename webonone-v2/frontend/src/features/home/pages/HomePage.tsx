import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '@webonone/ui-kit'
import { useServiceRedirect } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { apiClient } from '@/shared/services/apiClient'
import { authActions } from '@/features/auth/store/authSlice'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'

export function HomePage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const [apiStatus, setApiStatus] = useState<string>('checking...')
  const { redirect, error: profileError, clearError } = useServiceRedirect()

  useEffect(() => {
    apiClient<{ user: { id: string; email: string } }>('/me')
      .then(() => setApiStatus('API verified with Bearer JWT'))
      .catch(() => setApiStatus('API call failed'))
  }, [])

  function handleLogout() {
    dispatch(authActions.logout())
    navigate('/login')
  }

  async function handleProfileClick() {
    if (!accessToken) {
      navigate('/login')
      return
    }
    clearError()
    try {
      await redirect(getIdentityProfileRedirectOptions(accessToken))
    } catch {
      // error surfaced via hook state
    }
  }

  return (
    <PageShell
      title="WebOnOne"
      user={
        user
          ? {
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              email: user.email,
            }
          : null
      }
      onProfileClick={user ? handleProfileClick : undefined}
      onLogout={handleLogout}
    >
      <h1 className="text-3xl font-bold">Welcome, {user?.displayName ?? 'User'}!</h1>
      <p className="mt-2 text-muted-foreground">You are signed in to WebOnOne.</p>
      <p className="mt-4 text-sm text-muted-foreground">{apiStatus}</p>
      {profileError ? (
        <p className="mt-2 text-sm text-destructive">{profileError}</p>
      ) : null}
    </PageShell>
  )
}

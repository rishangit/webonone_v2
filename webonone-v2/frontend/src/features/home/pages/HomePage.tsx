import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { apiClient } from '@/shared/services/apiClient'
import { authActions } from '@/features/auth/store/authSlice'

export function HomePage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [apiStatus, setApiStatus] = useState<string>('checking...')

  useEffect(() => {
    apiClient<{ user: { id: string; email: string } }>('/me')
      .then(() => setApiStatus('API verified with Bearer JWT'))
      .catch(() => setApiStatus('API call failed'))
  }, [])

  function handleLogout() {
    dispatch(authActions.logout())
    navigate('/login')
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
      onLogout={handleLogout}
    >
      <h1 className="text-3xl font-bold">Welcome, {user?.displayName ?? 'User'}!</h1>
      <p className="mt-2 text-muted-foreground">You are signed in to WebOnOne.</p>
      <p className="mt-4 text-sm text-muted-foreground">{apiStatus}</p>
    </PageShell>
  )
}

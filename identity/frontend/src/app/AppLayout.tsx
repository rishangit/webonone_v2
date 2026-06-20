import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { PageShell, cn } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const isProfileRoute = location.pathname === '/profile'

  const headerUser =
    accessToken && user
      ? {
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: user.email,
        }
      : null

  function handleLogout() {
    dispatch(authActions.logout())
    navigate('/login')
  }

  function handleProfileClick() {
    navigate('/profile')
  }

  return (
    <PageShell
      user={headerUser}
      onProfileClick={headerUser ? handleProfileClick : undefined}
      onLogout={headerUser ? handleLogout : undefined}
    >
      <div
        className={cn(
          'flex min-h-[calc(100vh-3.5rem)] py-4',
          isProfileRoute ? 'items-start justify-center' : 'items-center justify-center',
        )}
      >
        <Outlet />
      </div>
    </PageShell>
  )
}

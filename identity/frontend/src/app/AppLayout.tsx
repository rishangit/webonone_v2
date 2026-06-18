import { Outlet, useNavigate } from 'react-router-dom'
import { PageShell } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'

export function AppLayout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)

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

  return (
    <PageShell user={headerUser} onLogout={headerUser ? handleLogout : undefined}>
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-4">
        <Outlet />
      </div>
    </PageShell>
  )
}

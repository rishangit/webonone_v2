import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, BrandLogo } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { mainNav } from '@/features/shell/config/navItems'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)

  function handleLogout() {
    dispatch(authActions.logout())
    navigate('/login')
  }

  return (
    <AppShell
      nav={mainNav}
      activePath={location.pathname}
      logo={<BrandLogo>Media</BrandLogo>}
      user={
        user
          ? {
              displayName: user.displayName,
              avatarUrl: user.avatarUrl ?? null,
              email: user.email,
            }
          : null
      }
      onLogout={handleLogout}
    >
      <Outlet />
    </AppShell>
  )
}

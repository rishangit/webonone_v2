import { Outlet, useLocation } from 'react-router-dom'
import { AppShell, BrandLogo } from '@webonone/ui-kit'
import { performPlatformLogout } from '@webonone/platform-nav'
import { useAppSelector } from '@/app/store/hooks'
import { clearMediaAuthStorage } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { mainNav } from '@/features/shell/config/navItems'

export function AppLayout() {
  const location = useLocation()
  const { user } = useAppSelector((s) => s.auth)

  function handleLogout() {
    clearMediaAuthStorage()
    performPlatformLogout(null, { identityOrigin: getIdentityOrigin() })
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

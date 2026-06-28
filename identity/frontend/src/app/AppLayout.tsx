import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CORE_NAV_QUERY_PARAM } from '@webonone/platform-nav'
import { AppShell, BrandLogo, PageShell } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import { useRedirectMode } from '@/features/auth/hooks/useRedirectMode'
import { parseProfileReturnUrl } from '@/features/profile/utils/profileReturn'
import {
  buildCoreNavFromQuery,
  buildStandaloneNav,
  isIdentityShellRoute,
} from '@/features/shell/config/navItems'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)

  const returnUrl = parseProfileReturnUrl(searchParams)
  const { isRedirect } = useRedirectMode()
  const isRedirectLogin = location.pathname === '/login' && isRedirect
  const nav = useMemo(
    () =>
      returnUrl
        ? buildCoreNavFromQuery(returnUrl, searchParams.get(CORE_NAV_QUERY_PARAM))
        : buildStandaloneNav(),
    [returnUrl, searchParams],
  )
  const brand = returnUrl ? 'WebOnOne' : 'Identity'
  const useShell = isIdentityShellRoute(location.pathname) && !isRedirectLogin

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

  if (useShell) {
    return (
      <AppShell
        nav={nav}
        activePath={location.pathname}
        logo={<BrandLogo>{brand}</BrandLogo>}
        user={headerUser}
        onProfileClick={headerUser ? handleProfileClick : undefined}
        onLogout={headerUser ? handleLogout : undefined}
      >
        <Outlet />
      </AppShell>
    )
  }

  return (
    <PageShell
      user={headerUser}
      onProfileClick={headerUser ? handleProfileClick : undefined}
      onLogout={headerUser ? handleLogout : undefined}
    >
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center py-4">
        <Outlet />
      </div>
    </PageShell>
  )
}

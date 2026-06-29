import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CORE_NAV_QUERY_PARAM, parsePlatformNavVariant, useServiceRedirect } from '@webonone/platform-nav'
import { relayThemeQueryParams } from '@webonone/theme'
import { AppShell, BrandLogo, PageShell } from '@webonone/ui-kit'
import type { NavConfigItem } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import { useRedirectMode } from '@/features/auth/hooks/useRedirectMode'
import { getEmailRedirectOptions } from '@/features/email/utils/redirectToEmail'
import { parseProfileReturnUrl } from '@/features/profile/utils/profileReturn'
import {
  buildCoreNavFromQuery,
  buildStandaloneNav,
  isIdentityShellRoute,
  PLATFORM_EMAIL_NAV,
} from '@/features/shell/config/navItems'

function withEmailNavAction(
  items: NavConfigItem[],
  onEmailClick: () => void,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item' && item.to === PLATFORM_EMAIL_NAV) {
      return { ...item, onClick: onEmailClick }
    }

    if (item.type === 'group') {
      return {
        ...item,
        children: item.children.map((child) =>
          child.to === PLATFORM_EMAIL_NAV ? { ...child, onClick: onEmailClick } : child,
        ),
      }
    }

    return item
  })
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { redirect, error: navError, clearError } = useServiceRedirect()

  const returnUrl = parseProfileReturnUrl(searchParams)
  const { isRedirect } = useRedirectMode()
  const isRedirectLogin = location.pathname === '/login' && isRedirect

  const handleEmailClick = useCallback(async () => {
    if (!accessToken || !returnUrl) {
      return
    }
    clearError()
    try {
      await redirect(
        getEmailRedirectOptions({
          accessToken,
          returnUrl,
          extraSearchParams: relayThemeQueryParams(searchParams),
          navVariant: parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM)),
        }),
      )
    } catch {
      // surfaced via hook
    }
  }, [accessToken, clearError, redirect, returnUrl, searchParams])

  const nav = useMemo(() => {
    const base = returnUrl
      ? buildCoreNavFromQuery(returnUrl, searchParams.get(CORE_NAV_QUERY_PARAM))
      : buildStandaloneNav()
    return returnUrl ? withEmailNavAction(base, handleEmailClick) : base
  }, [handleEmailClick, returnUrl, searchParams])

  const brand = returnUrl ? 'WebOnOne' : 'Identity'
  const isAuthenticated = Boolean(accessToken && user)
  const useShell =
    isAuthenticated && isIdentityShellRoute(location.pathname) && !isRedirectLogin

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
        {navError ? <p className="mt-4 text-sm text-destructive">{navError}</p> : null}
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
        {navError ? <p className="mt-4 text-sm text-destructive">{navError}</p> : null}
      </div>
    </PageShell>
  )
}

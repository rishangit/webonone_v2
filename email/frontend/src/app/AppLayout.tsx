import { useEffect, useMemo } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import {
  CORE_NAV_QUERY_PARAM,
  parsePlatformNavVariant,
  useServiceRedirect,
} from '@webonone/platform-nav'
import { AppShell, BrandLogo, PageShell } from '@webonone/ui-kit'
import { relayThemeQueryParams } from '@webonone/theme'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'
import { parsePlatformReturnUrl, hasPlatformHandoff } from '@/features/auth/utils/platformReturn'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { buildAppNav } from '@/features/shell/utils/buildAppNav'

export function AppLayout() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { accessToken, user, platform } = useAppSelector((s) => s.auth)
  const { redirect, error: profileError, clearError } = useServiceRedirect()

  const returnUrlFromQuery = parsePlatformReturnUrl(searchParams)
  const effectiveReturnUrl = platform.returnUrl ?? returnUrlFromQuery
  const isPlatformHandoff = hasPlatformHandoff(searchParams)
  const isPlatformMode = Boolean(effectiveReturnUrl)
  const isAuthenticated = Boolean(accessToken && user)
  const usePlatformShell = isPlatformMode && (isAuthenticated || isPlatformHandoff)

  const role: EmailRole = user?.role ?? 'member'
  const nav = useMemo(
    () =>
      buildAppNav(role, {
        returnUrl: effectiveReturnUrl,
        coreNavVariant:
          platform.coreNavVariant ??
          (returnUrlFromQuery
            ? parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM))
            : null),
      }),
    [effectiveReturnUrl, platform.coreNavVariant, returnUrlFromQuery, role, searchParams],
  )

  useEffect(() => {
    const returnUrl = parsePlatformReturnUrl(searchParams)
    if (!returnUrl || accessToken) {
      return
    }

    dispatch(
      authActions.setPlatformContext({
        returnUrl,
        coreNavVariant: parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM)),
      }),
    )
  }, [accessToken, dispatch, searchParams])

  async function handleProfileClick() {
    if (!accessToken || !effectiveReturnUrl) {
      return
    }
    clearError()
    try {
      await redirect(
        getIdentityProfileRedirectOptions({
          accessToken,
          returnUrl: effectiveReturnUrl,
          extraSearchParams: relayThemeQueryParams(searchParams),
          navVariant: platform.coreNavVariant ?? 'main',
        }),
      )
    } catch {
      // surfaced via hook
    }
  }

  function handleLogout() {
    dispatch(authActions.logout())
    window.location.assign('/login')
  }

  const headerUser =
    accessToken && user
      ? {
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          email: user.email,
        }
      : null

  if (usePlatformShell) {
    return (
      <AppShell
        nav={nav}
        activePath={location.pathname}
        logo={<BrandLogo>WebOnOne</BrandLogo>}
        user={headerUser}
        onProfileClick={handleProfileClick}
        onLogout={handleLogout}
      >
        <Outlet />
        {profileError ? <p className="mt-4 text-sm text-destructive">{profileError}</p> : null}
      </AppShell>
    )
  }

  if (isAuthenticated && !isPlatformMode) {
    return (
      <AppShell
        nav={nav}
        activePath={location.pathname}
        logo={<BrandLogo>Email</BrandLogo>}
        user={headerUser}
        onLogout={handleLogout}
      >
        <Outlet />
      </AppShell>
    )
  }

  return (
    <PageShell user={headerUser} onLogout={headerUser ? handleLogout : undefined}>
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center py-4">
        <Outlet />
      </div>
    </PageShell>
  )
}

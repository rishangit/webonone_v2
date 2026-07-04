import { useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CORE_NAV_QUERY_PARAM,
  parsePlatformNavVariant,
  performPlatformLogout,
  useServiceRedirect,
} from '@webonone/platform-nav'
import { Alert, AlertDescription, AppShell, BrandLogo, LoadingState, PageShell } from '@webonone/ui-kit'
import { relayThemeQueryParams } from '@webonone/theme'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions, clearEmailAuthStorage } from '@/features/auth/store/authSlice'
import { usePlatformSessionBootstrap } from '@/features/auth/hooks/usePlatformSessionBootstrap'
import { useRefreshEmailRole } from '@/features/auth/hooks/useRefreshEmailRole'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { parsePlatformReturnUrl, hasPlatformHandoff } from '@/features/auth/utils/platformReturn'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { buildAppNav } from '@/features/shell/utils/buildAppNav'
import { withClientSideNavigation } from '@/features/shell/utils/clientNav'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { accessToken, user, platform } = useAppSelector((s) => s.auth)
  const { redirect, error: profileError, clearError } = useServiceRedirect()
  const { isBootstrapping, bootstrapError } = usePlatformSessionBootstrap()
  const roleReady = useRefreshEmailRole(isBootstrapping)

  const returnUrlFromQuery = parsePlatformReturnUrl(searchParams)
  const isPlatformHandoff = hasPlatformHandoff(searchParams)
  const effectiveReturnUrl = returnUrlFromQuery ?? platform.returnUrl
  const isPlatformMode = Boolean(effectiveReturnUrl || isPlatformHandoff)
  const isAuthenticated = Boolean(accessToken && user)
  const usePlatformShell = isPlatformMode && (isAuthenticated || isPlatformHandoff)

  const role: EmailRole = user?.role ?? 'member'
  const nav = useMemo(() => {
    const base = buildAppNav(role, {
      returnUrl: effectiveReturnUrl,
      coreNavVariant:
        platform.coreNavVariant ??
        (returnUrlFromQuery
          ? parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM))
          : null),
      searchParams: isPlatformMode ? searchParams : undefined,
    })
    return withClientSideNavigation(base, navigate)
  }, [
    effectiveReturnUrl,
    isPlatformMode,
    navigate,
    platform.coreNavVariant,
    returnUrlFromQuery,
    role,
    searchParams,
  ])

  useEffect(() => {
    if (!isPlatformMode && !isPlatformHandoff) {
      dispatch(authActions.clearPlatformContext())
      return
    }

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
  }, [accessToken, dispatch, isPlatformMode, searchParams])

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
    const returnUrl = effectiveReturnUrl
    clearEmailAuthStorage()
    performPlatformLogout(returnUrl, { identityOrigin: getIdentityOrigin() })
  }

  const headerUser =
    accessToken && user
      ? {
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          email: user.email,
        }
      : null

  const sessionLoading = isBootstrapping || (Boolean(accessToken) && !roleReady)

  const mainContent =
    sessionLoading || bootstrapError ? (
      <div className="flex flex-col items-center gap-4 py-12">
        {sessionLoading ? <LoadingState overlay label="Loading session…" /> : null}
        {bootstrapError ? (
          <Alert variant="destructive">
            <AlertDescription>{bootstrapError}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    ) : (
      <Outlet />
    )

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
        {mainContent}
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
        {mainContent}
      </AppShell>
    )
  }

  return (
    <PageShell user={headerUser} onLogout={headerUser ? handleLogout : undefined}>
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center py-4">
        {mainContent}
      </div>
    </PageShell>
  )
}

import { useCallback, useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PLATFORM_EMBED_APP_HOST_CLASS, resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import {
  CORE_NAV_QUERY_PARAM,
  createNavItemNavigate,
  parsePlatformNavVariant,
  performPlatformLogout,
  useServiceRedirect,
} from '@webonone/platform-nav'
import { Alert, AlertDescription, AppShell, BrandLogo, LoadingState, PageShell } from '@webonone/ui-kit'
import { relayThemeQueryParams } from '@webonone/theme'
import { prefetchNavTarget } from '@/app/routePrefetch'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions, clearEmailAuthStorage } from '@/features/auth/store/authSlice'
import {
  PlatformLoadingProvider,
  usePlatformLoading,
  usePlatformOverlayLabel,
} from '@/features/auth/context/PlatformLoadingContext'
import { usePlatformSessionBootstrap } from '@/features/auth/hooks/usePlatformSessionBootstrap'
import { useRefreshEmailRole } from '@/features/auth/hooks/useRefreshEmailRole'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'
import { isAllowedParentOrigin, getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { PlatformEmbedLayout } from '@/features/auth/components/PlatformEmbedLayout'
import { parsePlatformReturnUrl, hasPlatformHandoff } from '@/features/auth/utils/platformReturn'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { getDataRedirectOptions } from '@/features/data/utils/redirectToData'
import { buildAppNav } from '@/features/shell/utils/buildAppNav'
import { withDataNavActions } from '@/features/shell/utils/externalNavActions'

export function AppLayout() {
  return (
    <PlatformLoadingProvider>
      <AppLayoutContent />
    </PlatformLoadingProvider>
  )
}

function AppLayoutContent() {
  const [searchParams] = useSearchParams()
  const embedParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  if (embedParentOrigin) {
    return (
      <div className={PLATFORM_EMBED_APP_HOST_CLASS}>
        <PlatformEmbedLayout parentOrigin={embedParentOrigin} />
      </div>
    )
  }

  return <AppLayoutShellContent />
}

function AppLayoutShellContent() {
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

  const onNavItemNavigate = useMemo(
    () =>
      createNavItemNavigate((target) =>
        navigate({ pathname: target.pathname, search: target.search || undefined }),
      ),
    [navigate],
  )

  const handleDataNavClick = useCallback(
    async (sentinel: string) => {
      if (!accessToken || !effectiveReturnUrl) {
        return
      }
      clearError()
      try {
        await redirect(
          getDataRedirectOptions({
            accessToken,
            returnUrl: effectiveReturnUrl,
            extraSearchParams: relayThemeQueryParams(searchParams),
            navVariant: platform.coreNavVariant ?? 'main',
            dataNavSentinel: sentinel,
          }),
        )
      } catch {
        // surfaced via hook
      }
    },
    [
      accessToken,
      clearError,
      effectiveReturnUrl,
      platform.coreNavVariant,
      redirect,
      searchParams,
    ],
  )

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
    return effectiveReturnUrl ? withDataNavActions(base, handleDataNavClick) : base
  }, [
    effectiveReturnUrl,
    handleDataNavClick,
    isPlatformMode,
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
  }, [accessToken, dispatch, isPlatformHandoff, isPlatformMode, searchParams])

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

  const sessionLoading = Boolean(accessToken) && !roleReady
  usePlatformLoading(sessionLoading ? 'Loading session…' : null)
  const overlayLabel = usePlatformOverlayLabel()

  const mainContent = (
    <div className="relative flex min-h-full flex-col">
      <Outlet />
      {bootstrapError ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{bootstrapError}</AlertDescription>
        </Alert>
      ) : null}
      {overlayLabel ? (
        <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />
      ) : null}
    </div>
  )

  const shellProps = {
    nav,
    activePath: location.pathname,
    onNavItemNavigate,
    onNavItemPrefetch: prefetchNavTarget,
    user: headerUser,
    onLogout: handleLogout,
  }

  if (usePlatformShell) {
    return (
      <AppShell
        {...shellProps}
        logo={<BrandLogo>WebOnOne</BrandLogo>}
        onProfileClick={handleProfileClick}
      >
        {mainContent}
        {profileError ? <p className="mt-4 text-sm text-destructive">{profileError}</p> : null}
      </AppShell>
    )
  }

  if (isAuthenticated && !isPlatformMode) {
    return (
      <AppShell {...shellProps} logo={<BrandLogo>Email</BrandLogo>}>
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

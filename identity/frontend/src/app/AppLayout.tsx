import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PLATFORM_EMBED_APP_HOST_CLASS, resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { CORE_NAV_QUERY_PARAM, createNavItemNavigate, parsePlatformNavVariant, performPlatformLogout, useServiceRedirect } from '@webonone/platform-nav'
import { relayThemeQueryParams } from '@webonone/theme'
import { AppShell, BrandLogo, LoadingState, PageShell } from '@webonone/ui-kit'
import type { NavConfigItem } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { useRedirectMode } from '@/features/auth/hooks/useRedirectMode'
import { PlatformEmbedLayout } from '@/features/auth/components/PlatformEmbedLayout'
import {
  PlatformLoadingProvider,
  usePlatformPageLabel,
  usePlatformRouteLabel,
} from '@/features/auth/context/PlatformLoadingContext'
import { getEmailRedirectOptions } from '@/features/email/utils/redirectToEmail'
import { parseProfileReturnUrl } from '@/features/profile/utils/profileReturn'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import {
  buildCoreNavFromQuery,
  buildStandaloneNav,
  isEmailNavSentinel,
  isIdentityShellRoute,
} from '@/features/shell/config/navItems'

function withEmailNavAction(
  items: NavConfigItem[],
  onEmailNavClick: (sentinel: string) => void,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item' && isEmailNavSentinel(item.to)) {
      return { ...item, onClick: () => onEmailNavClick(item.to) }
    }

    if (item.type === 'group') {
      return {
        ...item,
        children: item.children.map((child) =>
          isEmailNavSentinel(child.to) ? { ...child, onClick: () => onEmailNavClick(child.to) } : child,
        ),
      }
    }

    return item
  })
}

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
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { redirect, error: navError, clearError } = useServiceRedirect()
  const pageLabel = usePlatformPageLabel()
  const routeLabel = usePlatformRouteLabel()
  const overlayLabel = pageLabel ?? routeLabel

  const returnUrl = parseProfileReturnUrl(searchParams)
  const { isRedirect } = useRedirectMode()
  const isRedirectLogin = location.pathname === '/login' && isRedirect

  const onNavItemNavigate = useMemo(
    () =>
      createNavItemNavigate((target) =>
        navigate({ pathname: target.pathname, search: target.search || undefined }),
      ),
    [navigate],
  )

  const handleEmailNavClick = useCallback(
    async (sentinel: string) => {
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
            emailNavSentinel: sentinel,
          }),
        )
      } catch {
        // surfaced via hook
      }
    },
    [accessToken, clearError, redirect, returnUrl, searchParams],
  )

  const nav = useMemo(() => {
    const base = returnUrl
      ? buildCoreNavFromQuery(returnUrl, searchParams.get(CORE_NAV_QUERY_PARAM))
      : buildStandaloneNav()
    return returnUrl ? withEmailNavAction(base, handleEmailNavClick) : base
  }, [handleEmailNavClick, returnUrl, searchParams])

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
    performPlatformLogout(returnUrl, { identityOrigin: window.location.origin })
  }

  function handleProfileClick() {
    navigate('/profile')
  }

  const mainContent = (
    <div className="relative flex min-h-full flex-col">
      <Outlet />
      {navError ? <p className="mt-4 text-sm text-destructive">{navError}</p> : null}
      {overlayLabel ? (
        <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />
      ) : null}
    </div>
  )

  if (useShell) {
    return (
      <AppShell
        nav={nav}
        activePath={location.pathname}
        logo={<BrandLogo>{brand}</BrandLogo>}
        user={headerUser}
        onProfileClick={headerUser ? handleProfileClick : undefined}
        onLogout={headerUser ? handleLogout : undefined}
        onNavItemNavigate={onNavItemNavigate}
      >
        {mainContent}
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
        {mainContent}
      </div>
    </PageShell>
  )
}

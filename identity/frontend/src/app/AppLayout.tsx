import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  PLATFORM_EMBED_APP_HOST_CLASS,
  resolvePlatformEmbedParentOrigin,
} from '@webonone/platform-embed'
import { CORE_NAV_QUERY_PARAM, createNavItemNavigate, parsePlatformNavVariant, performPlatformLogout, useServiceRedirect } from '@webonone/platform-nav'
import { relayThemeQueryParams } from '@webonone/theme'
import { AppShell, BrandLogo, LoadingState, PageShell } from '@webonone/ui-kit'
import type { NavConfigItem } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { useEmbedLoginMode } from '@/features/auth/hooks/useEmbedLoginMode'
import { useRedirectMode } from '@/features/auth/hooks/useRedirectMode'
import { PlatformEmbedLayout } from '@/features/auth/components/PlatformEmbedLayout'
import { clearStoredAuthSession } from '@/features/auth/utils/authStorage'
import {
  PlatformLoadingProvider,
  usePlatformOverlayLabel,
} from '@/features/auth/context/PlatformLoadingContext'
import { getEmailRedirectOptions } from '@/features/email/utils/redirectToEmail'
import { getSmsRedirectOptions } from '@/features/sms/utils/redirectToSms'
import { parseProfileReturnUrl } from '@/features/profile/utils/profileReturn'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { isSessionCompanyAdmin, isSessionSuperAdmin } from '@/features/users/utils/currentRole'
import {
  buildCoreNavFromQuery,
  buildStandaloneNav,
  isEmailNavSentinel,
  isIdentityShellRoute,
  isSmsNavSentinel,
} from '@/features/shell/config/navItems'

const GUEST_AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-reset-otp',
  '/logout',
])

function isGuestAuthPath(pathname: string): boolean {
  return GUEST_AUTH_PATHS.has(pathname)
}

function withPeerNavActions(
  items: NavConfigItem[],
  onEmailNavClick: (sentinel: string) => void,
  onSmsNavClick: (sentinel: string) => void,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item') {
      if (isEmailNavSentinel(item.to)) {
        return { ...item, onClick: () => onEmailNavClick(item.to) }
      }
      if (isSmsNavSentinel(item.to)) {
        return { ...item, onClick: () => onSmsNavClick(item.to) }
      }
      return item
    }

    if (item.type === 'group') {
      return {
        ...item,
        children: item.children.map((child) => {
          if (isEmailNavSentinel(child.to)) {
            return { ...child, onClick: () => onEmailNavClick(child.to) }
          }
          if (isSmsNavSentinel(child.to)) {
            return { ...child, onClick: () => onSmsNavClick(child.to) }
          }
          return child
        }),
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
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Guest auth (WebOnOne login iframe uses parentOrigin without embed=platform) must
  // never use PlatformEmbedLayout — that layout waits for webonone:platform:init.
  // Skip stale platform-embed sessionStorage restore on these routes.
  if (!isGuestAuthPath(location.pathname)) {
    const embedParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
    if (embedParentOrigin) {
      return (
        <div className={PLATFORM_EMBED_APP_HOST_CLASS}>
          <PlatformEmbedLayout parentOrigin={embedParentOrigin} />
        </div>
      )
    }
  }

  return <AppLayoutShellContent />
}

function AppLayoutShellContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { redirect, error: navError, clearError } = useServiceRedirect()
  const overlayLabel = usePlatformOverlayLabel()

  const returnUrl = parseProfileReturnUrl(searchParams)
  const { isRedirect } = useRedirectMode()
  const { isEmbed } = useEmbedLoginMode()
  const isHandoffLogin =
    location.pathname === '/login' && (isRedirect || isEmbed)

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

  const handleSmsNavClick = useCallback(
    async (sentinel: string) => {
      if (!accessToken || !returnUrl) {
        return
      }
      clearError()
      try {
        await redirect(
          getSmsRedirectOptions({
            accessToken,
            returnUrl,
            extraSearchParams: relayThemeQueryParams(searchParams),
            navVariant: parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM)),
            smsNavSentinel: sentinel,
          }),
        )
      } catch {
        // surfaced via hook
      }
    },
    [accessToken, clearError, redirect, returnUrl, searchParams],
  )

  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const isCompanyAdmin = isSessionCompanyAdmin(accessToken)

  const nav = useMemo(() => {
    const base = returnUrl
      ? buildCoreNavFromQuery(returnUrl, searchParams.get(CORE_NAV_QUERY_PARAM))
      : buildStandaloneNav({ isSuperAdmin, isCompanyAdmin })
    return returnUrl ? withPeerNavActions(base, handleEmailNavClick, handleSmsNavClick) : base
  }, [handleEmailNavClick, handleSmsNavClick, isCompanyAdmin, isSuperAdmin, returnUrl, searchParams])

  const brand = returnUrl ? 'WebOnOne' : 'Identity'
  const isAuthenticated = Boolean(accessToken && user)
  const useShell =
    isAuthenticated && isIdentityShellRoute(location.pathname) && !isHandoffLogin

  const headerUser =
    accessToken && user
      ? {
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: user.email ?? undefined,
        }
      : null

  function handleLogout() {
    clearStoredAuthSession()
    performPlatformLogout(returnUrl, { identityOrigin: window.location.origin })
  }

  function handleProfileClick() {
    navigate('/profile')
  }

  const mainContent = (
    <div className="relative flex min-h-full w-full flex-col">
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

  // Embed login iframe / logout hop: fill the frame with no AppHeader.
  if (isEmbed || location.pathname === '/logout') {
    return (
      <div className="relative flex h-dvh w-full items-center justify-center overflow-y-auto p-4">
        <Outlet />
        {navError ? <p className="mt-4 text-sm text-destructive">{navError}</p> : null}
        {overlayLabel ? (
          <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />
        ) : null}
      </div>
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

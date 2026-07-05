import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, BrandLogo, LoadingState } from '@webonone/ui-kit'
import { performPlatformLogout, useServiceRedirect } from '@webonone/platform-nav'
import { buildThemePayload, serializeThemeQueryParams } from '@webonone/theme'
import type { NavConfigItem } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { clearWebOnOneAuthStorage } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { getNavVariantForSessionRole } from '@/features/session/utils/sessionNav'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'
import { getDataRedirectOptions } from '@/features/data/utils/redirectToData'
import { getEmailRedirectOptions } from '@/features/email/utils/redirectToEmail'
import { buildNavForSessionRole, isDataNavSentinel, isEmailNavSentinel } from '@/features/shell/config/navItems'
import { toThemeDto } from '@/features/settings/system-theme/services/themeApi'
import { ThemeProviderBridge } from '@/shared/theme/ThemeProviderBridge'
import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'
import { SessionRoleGate } from '@/features/session/components/SessionRoleGate'
import { formatSessionRoleLabel } from '@/features/session/utils/formatSessionRoleLabel'
import {
  PlatformLoadingProvider,
  usePlatformPageLabel,
  usePlatformRouteLabel,
} from '@/features/shell/context/PlatformLoadingContext'

function withExternalNavActions(
  items: NavConfigItem[],
  onEmailNavClick: (sentinel: string) => void,
  onDataNavClick: (sentinel: string) => void,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item' && isEmailNavSentinel(item.to)) {
      return { ...item, onClick: () => onEmailNavClick(item.to) }
    }
    if (item.type === 'item' && isDataNavSentinel(item.to)) {
      return { ...item, onClick: () => onDataNavClick(item.to) }
    }

    if (item.type === 'group') {
      return {
        ...item,
        children: item.children.map((child) => {
          if (isEmailNavSentinel(child.to)) {
            return { ...child, onClick: () => onEmailNavClick(child.to) }
          }
          if (isDataNavSentinel(child.to)) {
            return { ...child, onClick: () => onDataNavClick(child.to) }
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
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const preferences = useAppSelector((s) => s.systemTheme.preferences)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const roleLabel = formatSessionRoleLabel(activeRole)
  const { redirect, error: navError, clearError } = useServiceRedirect()

  useIdentityUserRefresh()

  const navVariant = useMemo(() => getNavVariantForSessionRole(activeRole), [activeRole])

  const handleEmailNavClick = useCallback(
    async (sentinel: string) => {
      if (!accessToken) {
        navigate('/login')
        return
      }
      clearError()
      const themeParams = preferences
        ? serializeThemeQueryParams(
            buildThemePayload(toThemeDto(preferences.theme), preferences.colorMode),
          )
        : undefined
      try {
        await redirect(
          getEmailRedirectOptions({
            accessToken,
            extraSearchParams: themeParams,
            navVariant,
            emailNavSentinel: sentinel,
          }),
        )
      } catch {
        // surfaced via hook
      }
    },
    [accessToken, clearError, navVariant, navigate, preferences, redirect],
  )

  const handleDataNavClick = useCallback(
    async (sentinel: string) => {
      if (!accessToken) {
        navigate('/login')
        return
      }
      clearError()
      const themeParams = preferences
        ? serializeThemeQueryParams(
            buildThemePayload(toThemeDto(preferences.theme), preferences.colorMode),
          )
        : undefined
      try {
        await redirect(
          getDataRedirectOptions({
            accessToken,
            extraSearchParams: themeParams,
            navVariant,
            dataNavSentinel: sentinel,
          }),
        )
      } catch {
        // surfaced via hook
      }
    },
    [accessToken, clearError, navVariant, navigate, preferences, redirect],
  )

  const nav = useMemo(() => {
    if (!activeRole) return []
    return withExternalNavActions(
      buildNavForSessionRole(activeRole),
      handleEmailNavClick,
      handleDataNavClick,
    )
  }, [activeRole, handleDataNavClick, handleEmailNavClick])

  function handleLogout() {
    clearWebOnOneAuthStorage()
    performPlatformLogout(null, { identityOrigin: getIdentityOrigin() })
  }

  async function handleProfileClick() {
    if (!accessToken) {
      navigate('/login')
      return
    }
    clearError()
    const themeParams = preferences
      ? serializeThemeQueryParams(
          buildThemePayload(toThemeDto(preferences.theme), preferences.colorMode),
        )
      : undefined
    try {
      await redirect(
        getIdentityProfileRedirectOptions({
          accessToken,
          extraSearchParams: themeParams,
          navVariant,
        }),
      )
    } catch {
      // surfaced via hook
    }
  }

  const pageLabel = usePlatformPageLabel()
  const routeLabel = usePlatformRouteLabel()
  const overlayLabel = pageLabel ?? routeLabel

  return (
    <ThemeProviderBridge>
      <SessionRoleGate>
        <AppShell
          nav={nav}
          activePath={location.pathname}
          logo={<BrandLogo>WebOnOne</BrandLogo>}
          user={
            user
              ? {
                  displayName: user.displayName,
                  avatarUrl: user.avatarUrl,
                  email: user.email,
                  roleLabel,
                }
              : null
          }
          onProfileClick={user ? handleProfileClick : undefined}
          onLogout={handleLogout}
        >
          <Outlet />
          {navError ? <p className="mt-4 text-sm text-destructive">{navError}</p> : null}
          {overlayLabel ? <LoadingState key="platform-loading" overlay label={overlayLabel} /> : null}
        </AppShell>
      </SessionRoleGate>
    </ThemeProviderBridge>
  )
}

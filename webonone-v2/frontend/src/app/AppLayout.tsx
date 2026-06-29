import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, BrandLogo } from '@webonone/ui-kit'
import { useServiceRedirect } from '@webonone/platform-nav'
import { buildThemePayload, serializeThemeQueryParams } from '@webonone/theme'
import type { NavConfigItem } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'
import { getEmailRedirectOptions } from '@/features/email/utils/redirectToEmail'
import { mainNav, PLATFORM_EMAIL_NAV, superAdminNav } from '@/features/shell/config/navItems'
import { useSuperAdminStatus } from '@/features/settings/basic/hooks/useSuperAdminStatus'
import { toThemeDto } from '@/features/settings/system-theme/services/themeApi'
import { ThemeProviderBridge } from '@/shared/theme/ThemeProviderBridge'
import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'

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
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const preferences = useAppSelector((s) => s.systemTheme.preferences)
  const { redirect, error: navError, clearError } = useServiceRedirect()

  useIdentityUserRefresh()
  const { isSuperAdmin } = useSuperAdminStatus()

  const handleEmailClick = useCallback(async () => {
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
          navVariant: isSuperAdmin ? 'superAdmin' : 'main',
        }),
      )
    } catch {
      // surfaced via hook
    }
  }, [accessToken, clearError, isSuperAdmin, navigate, preferences, redirect])

  const nav = useMemo(
    () => withEmailNavAction(isSuperAdmin ? superAdminNav : mainNav, handleEmailClick),
    [handleEmailClick, isSuperAdmin],
  )

  function handleLogout() {
    dispatch(authActions.logout())
    navigate('/login')
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
          navVariant: isSuperAdmin ? 'superAdmin' : 'main',
        }),
      )
    } catch {
      // surfaced via hook
    }
  }

  return (
    <ThemeProviderBridge>
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
              }
            : null
        }
        onProfileClick={user ? handleProfileClick : undefined}
        onLogout={handleLogout}
      >
        <Outlet />
        {navError ? <p className="mt-4 text-sm text-destructive">{navError}</p> : null}
      </AppShell>
    </ThemeProviderBridge>
  )
}

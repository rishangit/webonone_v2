import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, BrandLogo } from '@webonone/ui-kit'
import { useServiceRedirect } from '@webonone/platform-nav'
import { buildThemePayload, serializeThemeQueryParams } from '@webonone/theme'
import type { NavConfigItem } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { store } from '@/app/store'
import { authActions } from '@/features/auth/store/authSlice'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { getNavVariantForSessionRole } from '@/features/session/utils/sessionNav'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'
import { getEmailRedirectOptions } from '@/features/email/utils/redirectToEmail'
import { syncEmailRoleBeforeHandoff } from '@/features/email/utils/syncEmailRole'
import { buildNavForSessionRole, isEmailNavSentinel } from '@/features/shell/config/navItems'
import { toThemeDto } from '@/features/settings/system-theme/services/themeApi'
import { ThemeProviderBridge } from '@/shared/theme/ThemeProviderBridge'
import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'
import { SessionRoleGate } from '@/features/session/components/SessionRoleGate'
import { formatSessionRoleLabel } from '@/features/session/utils/formatSessionRoleLabel'

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
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
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
        await syncEmailRoleBeforeHandoff(() => store.getState())
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

  const nav = useMemo(() => {
    if (!activeRole) return []
    return withEmailNavAction(buildNavForSessionRole(activeRole), handleEmailNavClick)
  }, [activeRole, handleEmailNavClick])

  function handleLogout() {
    dispatch(authActions.logout())
    dispatch(sessionRoleActions.reset())
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
          navVariant,
        }),
      )
    } catch {
      // surfaced via hook
    }
  }

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
        </AppShell>
      </SessionRoleGate>
    </ThemeProviderBridge>
  )
}

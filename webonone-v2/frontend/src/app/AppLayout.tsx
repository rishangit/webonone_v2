import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, BrandLogo } from '@webonone/ui-kit'
import { useServiceRedirect } from '@webonone/platform-nav'
import { buildThemePayload, serializeThemeQueryParams } from '@webonone/theme'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { getIdentityProfileRedirectOptions } from '@/features/auth/utils/redirectToIdentityProfile'
import { mainNav } from '@/features/shell/config/navItems'
import { toThemeDto } from '@/features/settings/system-theme/services/themeApi'
import { ThemeProviderBridge } from '@/shared/theme/ThemeProviderBridge'
import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const preferences = useAppSelector((s) => s.systemTheme.preferences)
  const { redirect, error: profileError, clearError } = useServiceRedirect()

  useIdentityUserRefresh()

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
      await redirect(getIdentityProfileRedirectOptions(accessToken, themeParams))
    } catch {
      // surfaced via hook
    }
  }

  return (
    <ThemeProviderBridge>
      <AppShell
        nav={mainNav}
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
        {profileError ? <p className="mt-4 text-sm text-destructive">{profileError}</p> : null}
      </AppShell>
    </ThemeProviderBridge>
  )
}

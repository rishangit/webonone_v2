import { Outlet, useLocation } from 'react-router-dom'
import { AppShell, BrandLogo, LoadingState } from '@webonone/ui-kit'
import { performPlatformLogout } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { mainNav } from '@/features/shell/config/navItems'
import {
  PlatformLoadingProvider,
  usePlatformOverlayLabel,
} from '@/features/shell/context/PlatformLoadingContext'

export function AppLayout() {
  return (
    <PlatformLoadingProvider>
      <AppLayoutContent />
    </PlatformLoadingProvider>
  )
}

function AppLayoutContent() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const { user } = useAppSelector((s) => s.auth)
  const overlayLabel = usePlatformOverlayLabel()

  function handleLogout() {
    dispatch(authActions.logout())
    performPlatformLogout(null, { identityOrigin: getIdentityOrigin() })
  }

  return (
    <AppShell
      nav={mainNav}
      activePath={location.pathname}
      logo={<BrandLogo>Media</BrandLogo>}
      user={
        user
          ? {
              displayName: user.displayName,
              avatarUrl: user.avatarUrl ?? null,
              email: user.email,
            }
          : null
      }
      onLogout={handleLogout}
    >
      <div className="relative flex min-h-full flex-col">
        <Outlet />
        {overlayLabel ? (
          <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />
        ) : null}
      </div>
    </AppShell>
  )
}

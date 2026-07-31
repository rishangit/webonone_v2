import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, BrandLogo, LoadingState } from '@webonone/ui-kit'
import {
  createNavItemNavigate,
  isDataNavSentinel,
  isEmailNavSentinel,
  isIdentityNavSentinel,
  isPaymentNavSentinel,
  isProfileNavSentinel,
  isSmsNavSentinel,
  performPlatformLogout,
} from '@webonone/platform-nav'
import { prefetchNavTarget } from '@/app/routePrefetch'
import { useAppSelector } from '@/app/store/hooks'
import { clearWebOnOneAuthStorage } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'
import { buildNavForSessionRole } from '@/features/shell/config/navItems'
import { ThemeProviderBridge } from '@/shared/theme/ThemeProviderBridge'
import { SessionRoleGate } from '@/features/session/components/SessionRoleGate'
import {
  fallbackAccountLabel,
  findMatchingRole,
} from '@/features/session/utils/accountLabels'
import { PlatformMediaDialogProvider } from '@/features/media/PlatformMediaDialogHost'
import { PlatformPeerDialogProvider } from '@/features/shell/PlatformPeerDialogHost'
import {
  PlatformLoadingProvider,
  usePlatformOverlayLabel,
} from '@/features/shell/context/PlatformLoadingContext'

function isPlatformPeerEmbedPath(pathname: string, activeRole: string | null): boolean {
  if (
    isEmailNavSentinel(pathname) ||
    pathname.startsWith('/email/') ||
    isSmsNavSentinel(pathname) ||
    pathname.startsWith('/sms/') ||
    isPaymentNavSentinel(pathname) ||
    pathname.startsWith('/payment/') ||
    isIdentityNavSentinel(pathname) ||
    isProfileNavSentinel(pathname)
  ) {
    return true
  }
  // Data library embed is only for super_admin; company_admin uses native catalog pages.
  if (isDataNavSentinel(pathname) || pathname.startsWith('/data/')) {
    return activeRole === 'super_admin'
  }
  return false
}

export function AppLayout() {
  return (
    <PlatformLoadingProvider>
      <PlatformMediaDialogProvider>
        <PlatformPeerDialogProvider>
          <AppLayoutContent />
        </PlatformPeerDialogProvider>
      </PlatformMediaDialogProvider>
    </PlatformLoadingProvider>
  )
}

function AppLayoutContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { activeRole, activeCompanyId, assumableRoles, selectionComplete } = useAppSelector(
    (s) => s.sessionRole,
  )

  useIdentityUserRefresh()

  const onNavItemNavigate = useMemo(
    () =>
      createNavItemNavigate((target) =>
        navigate({ pathname: target.pathname, search: target.search || undefined }),
      ),
    [navigate],
  )

  const nav = useMemo(() => {
    if (!activeRole) return []
    const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
    if (activeRole === 'company_admin' || (activeRole === 'member' && activeCompanyId)) {
      return buildNavForSessionRole(activeRole, matched?.dataEntities ?? [], activeCompanyId)
    }
    return buildNavForSessionRole(activeRole, undefined, activeCompanyId)
  }, [activeRole, activeCompanyId, assumableRoles])

  const sidebarSession = useMemo(() => {
    if (!user || !selectionComplete || !activeRole) {
      return null
    }
    const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
    const title =
      matched?.companyName ?? matched?.label ?? fallbackAccountLabel(activeRole, activeCompanyId)
    const displayRole = matched?.accountKind === 'staff' ? 'staff' : activeRole
    return {
      title,
      role: displayRole,
      imageUrl: matched?.companyLogoUrl ?? null,
    }
  }, [user, selectionComplete, activeRole, activeCompanyId, assumableRoles])

  const headerUser = useMemo(() => {
    if (!user) return null
    const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
    const displayRole =
      matched?.accountKind === 'staff' ? 'staff' : (activeRole ?? undefined)
    return {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: user.email,
      role: displayRole,
    }
  }, [user, activeRole, activeCompanyId, assumableRoles])

  function handleLogout() {
    clearWebOnOneAuthStorage()
    performPlatformLogout(null, { identityOrigin: getIdentityOrigin() })
  }

  function handleProfileClick() {
    if (!accessToken) {
      navigate('/login')
      return
    }
    navigate('/profile')
  }

  const overlayLabel = usePlatformOverlayLabel()
  const embedMain = isPlatformPeerEmbedPath(location.pathname, activeRole)

  return (
    <ThemeProviderBridge>
      <SessionRoleGate>
        <AppShell
          embedMain={embedMain}
          nav={nav}
          activePath={location.pathname}
          logo={<BrandLogo>WebOnOne</BrandLogo>}
          user={headerUser}
          sidebarSession={sidebarSession}
          onProfileClick={user ? handleProfileClick : undefined}
          onLogout={handleLogout}
          onNavItemNavigate={onNavItemNavigate}
          onNavItemPrefetch={prefetchNavTarget}
          accordionNavGroups
        >
          <div className={embedMain ? 'relative flex h-full min-h-0 flex-col' : 'relative flex min-h-full flex-col'}>
            <Outlet />
            {overlayLabel ? (
              <LoadingState key="platform-loading" overlay overlayScope="content" label={overlayLabel} />
            ) : null}
          </div>
        </AppShell>
      </SessionRoleGate>
    </ThemeProviderBridge>
  )
}

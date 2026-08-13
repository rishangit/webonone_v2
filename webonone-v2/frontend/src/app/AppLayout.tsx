import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell, BrandLogo, LoadingState } from '@webonone/ui-kit'
import { clearIdentityEmbedSession } from '@webonone/platform-embed'
import {
  appendPromptLogin,
  buildClearFirstLogoutUrl,
  createNavItemNavigate,
  isDataNavSentinel,
  isEmailNavSentinel,
  isIdentityNavSentinel,
  isDesignNavSentinel,
  isPaymentNavSentinel,
  isProfileNavSentinel,
  isSmsNavSentinel,
} from '@webonone/platform-nav'
import { normalizeLocale, translateNavItems, type AppLocale } from '@webonone/i18n'
import { prefetchNavTarget } from '@/app/routePrefetch'
import { useAppSelector } from '@/app/store/hooks'
import { clearWebOnOneAuthStorage } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { buildWebOnOneLoginHref } from '@/features/auth/utils/buildWebOnOneLoginHref'
import { getWebsiteOrigin } from '@/features/auth/utils/websiteConfig'
import { clearSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'
import { useIdentityUserRefresh } from '@/features/auth/hooks/useIdentityUserRefresh'
import { patchIdentityLocale } from '@/features/auth/services/identityUserApi'
import { buildNavForSessionRole } from '@/features/shell/config/navItems'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
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
    isDesignNavSentinel(pathname) ||
    pathname.startsWith('/design/') ||
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
  const { t, i18n } = useTranslation('common')
  const { t: tShell } = useTranslation('shell')
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { activeRole, activeCompanyId, assumableRoles, selectionComplete } = useAppSelector(
    (s) => s.sessionRole,
  )
  const currentLocale = normalizeLocale(i18n.language)

  useIdentityUserRefresh()

  const onNavItemNavigate = useMemo(
    () =>
      createNavItemNavigate((target) =>
        navigate({ pathname: target.pathname, search: target.search || undefined }),
      ),
    [navigate],
  )

  const handleLocaleChange = useCallback(
    (locale: AppLocale) => {
      void changeAppLocale(locale, {
        persistToIdentity: accessToken
          ? async (lng) => {
              await patchIdentityLocale(accessToken, lng)
            }
          : undefined,
      })
    },
    [accessToken],
  )

  const headerLabels = useMemo(
    () => ({
      language: t('language'),
      english: t('english'),
      sinhala: t('sinhala'),
      profile: t('profile'),
      logout: t('logout'),
    }),
    [t],
  )

  const nav = useMemo(() => {
    if (!activeRole) return []
    const matched = findMatchingRole(assumableRoles, activeRole, activeCompanyId)
    const items =
      activeRole === 'company_admin' || (activeRole === 'member' && activeCompanyId)
        ? buildNavForSessionRole(activeRole, matched?.dataEntities ?? [], activeCompanyId)
        : buildNavForSessionRole(activeRole, undefined, activeCompanyId)
    return translateNavItems(items, t)
  }, [activeRole, activeCompanyId, assumableRoles, t])

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
    const websiteOrigin = getWebsiteOrigin()
    const loginUrl = appendPromptLogin(`${window.location.origin}/login`)
    const identityOrigin = getIdentityOrigin()
    const logoutUrl = buildClearFirstLogoutUrl([websiteOrigin], identityOrigin, loginUrl)

    console.log('[webonone-auth]', 'logout() start', {
      href: window.location.href,
      logoutUrl,
      websiteOrigin,
      identityOrigin,
    })

    clearWebOnOneAuthStorage()
    clearSessionRoleStorage()

    // Navigate immediately — do not await embed clear (same race as website logout).
    void clearIdentityEmbedSession({ identityOrigin })
    console.log('[webonone-auth]', 'logout() → replace clear-first chain', { logoutUrl })
    window.location.replace(logoutUrl)
  }

  function handleProfileClick() {
    if (!accessToken) {
      const returnPath = `${location.pathname}${location.search}`
      navigate(buildWebOnOneLoginHref(returnPath))
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
          logo={<BrandLogo>{tShell('brand')}</BrandLogo>}
          user={headerUser}
          sidebarSession={sidebarSession}
          onProfileClick={user ? handleProfileClick : undefined}
          onLogout={handleLogout}
          locale={currentLocale}
          onLocaleChange={handleLocaleChange}
          headerLabels={headerLabels}
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

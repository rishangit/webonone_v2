import { useCallback, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { normalizeLocale, translateNavItems, type AppLocale } from '@webonone/i18n'
import { AppShell, BrandLogo, LoadingState } from '@webonone/ui-kit'
import { performPlatformLogout } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { mainNav } from '@/features/shell/config/navItems'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
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
  const { t, i18n } = useTranslation('common')
  const { t: tShell } = useTranslation('shell')
  const { user } = useAppSelector((s) => s.auth)
  const overlayLabel = usePlatformOverlayLabel()
  const currentLocale = normalizeLocale(i18n.language)

  const handleLocaleChange = useCallback((locale: AppLocale) => {
    void changeAppLocale(locale)
  }, [])

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

  const nav = useMemo(() => translateNavItems(mainNav, t), [t])

  function handleLogout() {
    dispatch(authActions.logout())
    performPlatformLogout(null, { identityOrigin: getIdentityOrigin() })
  }

  return (
    <AppShell
      nav={nav}
      activePath={location.pathname}
      logo={<BrandLogo>{tShell('brand')}</BrandLogo>}
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
      locale={currentLocale}
      onLocaleChange={handleLocaleChange}
      headerLabels={headerLabels}
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

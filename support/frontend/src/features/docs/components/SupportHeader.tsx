import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ExternalLink, Home, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { normalizeLocale, type AppLocale } from '@webonone/i18n'
import {
  AppHeader,
  BrandLogo,
  Button,
  DropdownMenuItem,
  HeaderLocaleMenu,
  SearchInput,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { getSessionPlatformRole } from '@/features/auth/utils/currentRole'
import { redirectToIdentityProfile } from '@/features/auth/utils/redirectToIdentityProfile'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { getWebsiteOrigin } from '@/features/docs/utils/peerConfig'
import { redirectToWebOnOneApp } from '@/features/webonone/utils/webononeConfig'

interface SupportHeaderProps {
  className?: string
  showMenuButton?: boolean
  menuOpen?: boolean
  onMenuClick?: () => void
}

export function SupportHeader({
  className,
  showMenuButton = false,
  menuOpen = false,
  onMenuClick,
}: SupportHeaderProps) {
  const { t, i18n } = useTranslation('common')
  const { t: ts } = useTranslation('shell')
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const [query, setQuery] = useState('')
  const currentLocale = normalizeLocale(i18n.language)

  const handleLocaleChange = useCallback((locale: AppLocale) => {
    void changeAppLocale(locale)
  }, [])

  const headerUser = useMemo(() => {
    if (!accessToken || !user) {
      return null
    }
    const role = getSessionPlatformRole(accessToken)
    return {
      displayName: user.displayName?.trim() || user.email,
      avatarUrl: user.avatarUrl ?? null,
      email: user.email,
      role: role ?? undefined,
    }
  }, [accessToken, user])

  const headerLabels = useMemo(
    () => ({
      language: t('language'),
      english: t('english'),
      sinhala: t('sinhala'),
      profile: t('profile'),
      logout: ts('signOut'),
    }),
    [t, ts],
  )

  const handleLogout = useCallback(() => {
    dispatch(authActions.logout())
  }, [dispatch])

  const handleProfileClick = useCallback(async () => {
    if (!accessToken) {
      return
    }
    const returnUrl = `${window.location.origin}${location.pathname}${location.search}`
    await redirectToIdentityProfile({ accessToken, returnUrl })
  }, [accessToken, location.pathname, location.search])

  const handleOpenApp = useCallback(() => {
    if (!accessToken) {
      return
    }
    void redirectToWebOnOneApp(accessToken)
  }, [accessToken])

  function submitSearch() {
    const next = query.trim()
    if (!next) {
      navigate('/search')
      return
    }
    navigate(`/search?q=${encodeURIComponent(next)}`)
  }

  const menuItems = headerUser ? (
    <DropdownMenuItem onClick={handleOpenApp}>
      <ExternalLink />
      {ts('openApp')}
    </DropdownMenuItem>
  ) : null

  return (
    <AppHeader
      className={className}
      logo={<BrandLogo href="/">{ts('brand')}</BrandLogo>}
      user={headerUser}
      onProfileClick={headerUser ? handleProfileClick : undefined}
      onLogout={headerUser ? handleLogout : undefined}
      menuItems={menuItems}
      labels={headerLabels}
      showMenuButton={showMenuButton}
      menuOpen={menuOpen}
      onMenuClick={onMenuClick}
      trailingActions={
        <div className="flex items-center gap-2">
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submitSearch()
              }
            }}
            placeholder={ts('searchPlaceholder')}
            aria-label={ts('searchAria')}
            className="hidden w-40 sm:flex md:w-48 lg:w-56"
          />
          <HeaderLocaleMenu
            locale={currentLocale}
            onLocaleChange={handleLocaleChange}
            labels={{
              language: headerLabels.language,
              english: headerLabels.english,
              sinhala: headerLabels.sinhala,
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 sm:hidden"
            aria-label={ts('searchAria')}
            onClick={() => navigate('/search')}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
            <a href={`${getWebsiteOrigin()}/`} aria-label={ts('homeSite')}>
              <Home className="h-4 w-4" />
            </a>
          </Button>
          {!headerUser ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0"
              onClick={() =>
                navigate(`/login?return=${encodeURIComponent(`${location.pathname}${location.search}` || '/feedback')}`)
              }
            >
              {ts('signIn')}
            </Button>
          ) : null}
        </div>
      }
    />
  )
}

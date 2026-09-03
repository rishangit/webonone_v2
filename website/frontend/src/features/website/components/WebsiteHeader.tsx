import { useCallback, useMemo } from 'react'
import { CircleHelp, ExternalLink, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { normalizeLocale, type AppLocale } from '@webonone/i18n'
import {
  AppHeader,
  BrandLogo,
  Button,
  DropdownMenuItem,
  cn,
} from '@webonone/ui-kit'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { getWebsiteLoginHref } from '@/features/auth/utils/identityConfig'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { redirectToWebOnOneApp } from '@/features/webonone/utils/webononeConfig'
import { getSupportHomeUrl } from '@/shared/utils/supportConfig'

type WebsiteHeaderProps = {
  className?: string
  assistantOpen?: boolean
  onAssistantOpenChange?: (open: boolean) => void
}

export function WebsiteHeader({
  className,
  assistantOpen = false,
  onAssistantOpenChange,
}: WebsiteHeaderProps) {
  const { user, accessToken, isAuthenticated, isAuthPending, logout } = useWebsiteAuth()
  const { t, i18n } = useTranslation('common')
  const { t: ts } = useTranslation('shell')
  const { t: ta } = useTranslation('auth')
  const { t: tSearch } = useTranslation('search')
  const currentLocale = normalizeLocale(i18n.language)
  const isLoginPage =
    typeof window !== 'undefined' && window.location.pathname === '/login'

  const handleLocaleChange = useCallback((locale: AppLocale) => {
    void changeAppLocale(locale)
  }, [])

  const handleOpenApp = useCallback(() => {
    if (!accessToken) return
    void redirectToWebOnOneApp(accessToken)
  }, [accessToken])

  const headerLabels = useMemo(
    () => ({
      language: t('language'),
      english: t('english'),
      sinhala: t('sinhala'),
      logout: t('logout'),
    }),
    [t],
  )

  const headerUser = useMemo(
    () =>
      user
        ? {
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            email: user.email,
          }
        : null,
    [user],
  )

  const headerActions = (
    <>
      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
        <a href={getSupportHomeUrl()} target="_blank" rel="noreferrer" aria-label={ts('help')}>
          <CircleHelp className="h-4 w-4" />
        </a>
      </Button>
      {onAssistantOpenChange ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('h-9 w-9 shrink-0', assistantOpen && 'border-primary text-primary')}
          aria-label={tSearch('assistantOpen')}
          aria-pressed={assistantOpen}
          onClick={() => onAssistantOpenChange(!assistantOpen)}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      ) : null}
    </>
  )

  const trailingActions = isAuthPending ? (
    <div
      className="h-8 w-[4.5rem] shrink-0 rounded-md bg-muted/60"
      role="status"
      aria-label={ts('checkingSession')}
    />
  ) : !isAuthenticated && !isLoginPage ? (
    <Button type="button" size="sm" asChild>
      <a href={getWebsiteLoginHref(`${window.location.pathname}${window.location.search}`)}>
        {ta('login')}
      </a>
    </Button>
  ) : null

  const menuItems = isAuthenticated ? (
    <DropdownMenuItem onClick={handleOpenApp}>
      <ExternalLink />
      {ts('openApp')}
    </DropdownMenuItem>
  ) : null

  return (
    <AppHeader
      className={className}
      logo={<BrandLogo href="/">WebOnOne</BrandLogo>}
      user={headerUser}
      onLogout={isAuthenticated ? logout : undefined}
      locale={currentLocale}
      onLocaleChange={handleLocaleChange}
      labels={headerLabels}
      actions={headerActions}
      trailingActions={trailingActions}
      menuItems={menuItems}
    />
  )
}

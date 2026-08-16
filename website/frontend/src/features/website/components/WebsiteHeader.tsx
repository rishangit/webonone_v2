import { useCallback, useMemo } from 'react'
import { Globe, LogOut, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { normalizeLocale, type AppLocale } from '@webonone/i18n'
import {
  Avatar,
  BrandLogo,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  cn,
} from '@webonone/ui-kit'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { getWebsiteLoginHref } from '@/features/auth/utils/identityConfig'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import {
  getWebOnOneAppUrl,
  redirectToWebOnOneApp,
} from '@/features/webonone/utils/webononeConfig'

type WebsiteHeaderProps = {
  className?: string
  assistantOpen?: boolean
  onAssistantOpenChange?: (open: boolean) => void
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
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
    if (accessToken) {
      void redirectToWebOnOneApp(accessToken)
      return
    }
    window.location.assign(getWebOnOneAppUrl())
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

  return (
    <header
      className={`flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8 ${className ?? ''}`}
    >
      <a href="/" className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandLogo>WebOnOne</BrandLogo>
      </a>
      <div className="flex items-center gap-2">
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
        <Button type="button" size="sm" variant="outline" onClick={handleOpenApp}>
          {ts('openApp')}
        </Button>
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={ts('userMenu')}
              >
                <Avatar
                  size="sm"
                  src={user.avatarUrl}
                  alt={user.displayName}
                  fallback={getInitials(user.displayName)}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-lg">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  {user.email ? (
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Globe />
                  {headerLabels.language}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={() => handleLocaleChange('en')}
                    className={currentLocale === 'en' ? 'bg-accent' : undefined}
                  >
                    {headerLabels.english}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleLocaleChange('si')}
                    className={currentLocale === 'si' ? 'bg-accent' : undefined}
                  >
                    {headerLabels.sinhala}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={logout}>
                <LogOut />
                {headerLabels.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : isAuthPending ? (
          <div
            className="h-8 w-[4.5rem] shrink-0 rounded-md bg-muted/60"
            role="status"
            aria-label={ts('checkingSession')}
          />
        ) : isLoginPage ? null : (
          <Button type="button" size="sm" asChild>
            <a href={getWebsiteLoginHref(`${window.location.pathname}${window.location.search}`)}>
              {ta('login')}
            </a>
          </Button>
        )}
      </div>
    </header>
  )
}

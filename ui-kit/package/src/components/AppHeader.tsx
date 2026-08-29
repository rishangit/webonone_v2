import type { ReactNode } from 'react'
import { Globe, LogOut, Menu, User, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Avatar } from './Avatar'
import { BrandLogo } from './BrandLogo'
import { Button } from './Button'
import { isStatusTagVariant, StatusTag } from './StatusTag'
import { shellContentPaddingX, APP_HEADER_NOTICE_OFFSET_CLASS } from '../layouts/shellContentPadding'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'

export interface AppHeaderUser {
  displayName: string
  avatarUrl?: string | null
  email?: string
  /**
   * Platform role key (`super_admin` | `company_admin` | `member` | `staff`) shown as a
   * StatusTag below email in the user dropdown.
   */
  role?: string
  /**
   * Plain-text fallback when `role` is omitted. Prefer `role` for StatusTag styling.
   * @deprecated Prefer `role`
   */
  roleLabel?: string
}

export type AppHeaderLocale = 'en' | 'si'

interface HeaderLocaleMenuProps {
  locale?: AppHeaderLocale
  onLocaleChange: (locale: AppHeaderLocale) => void
  labels?: {
    language?: string
    english?: string
    sinhala?: string
  }
}

function HeaderLocaleMenu({ locale, onLocaleChange, labels }: HeaderLocaleMenuProps) {
  const languageLabel = labels?.language ?? 'Language'
  const englishLabel = labels?.english ?? 'English'
  const sinhalaLabel = labels?.sinhala ?? 'සිංහල'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={languageLabel}
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="shadow-lg">
        <DropdownMenuItem
          onSelect={() => onLocaleChange('en')}
          className={locale === 'en' ? 'bg-accent' : undefined}
        >
          {englishLabel}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onLocaleChange('si')}
          className={locale === 'si' ? 'bg-accent' : undefined}
        >
          {sinhalaLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HeaderRoleTag({ role, roleLabel }: { role?: string; roleLabel?: string }) {
  if (role && isStatusTagVariant(role)) {
    return <StatusTag variant={role} className="w-fit" />
  }
  if (role) {
    return (
      <StatusTag variant="member" className="w-fit">
        {roleLabel ?? role}
      </StatusTag>
    )
  }
  if (roleLabel) {
    return (
      <StatusTag variant="member" className="w-fit">
        {roleLabel}
      </StatusTag>
    )
  }
  return null
}

interface AppHeaderProps {
  logo?: ReactNode
  logoHref?: string
  user?: AppHeaderUser | null
  onProfileClick?: () => void
  onLogout?: () => void
  /** Current UI locale when language switching is enabled. */
  locale?: AppHeaderLocale
  /** Called when the user picks English or Sinhala from the menu. */
  onLocaleChange?: (locale: AppHeaderLocale) => void
  /** Optional override labels (defaults: Language / English / සිංහල / Profile / Log out). */
  labels?: {
    language?: string
    english?: string
    sinhala?: string
    profile?: string
    logout?: string
  }
  /** Extra items in the user dropdown, rendered after the profile block and separator. */
  menuItems?: ReactNode
  onMenuClick?: () => void
  showMenuButton?: boolean
  menuOpen?: boolean
  /** Optional header actions (e.g. chat toggle), rendered before the user avatar. */
  actions?: ReactNode
  /** Optional header actions after locale (e.g. sign-in), rendered before the user avatar. */
  trailingActions?: ReactNode
  /** Full-width notice overlay at the top of the header (e.g. impersonation warning). */
  notice?: ReactNode
  className?: string
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

function AppHeader({
  logo,
  logoHref,
  user,
  onProfileClick,
  onLogout,
  locale,
  onLocaleChange,
  labels,
  onMenuClick,
  showMenuButton = false,
  menuOpen = false,
  actions,
  trailingActions,
  notice,
  menuItems,
  className,
}: AppHeaderProps) {
  const logoNode = logo ?? <BrandLogo href={logoHref} />
  const languageLabel = labels?.language ?? 'Language'
  const englishLabel = labels?.english ?? 'English'
  const sinhalaLabel = labels?.sinhala ?? 'සිංහල'
  const profileLabel = labels?.profile ?? 'Profile'
  const logoutLabel = labels?.logout ?? 'Log out'

  return (
    <header
      className={cn(
        'relative shrink-0 shell-glass border-b',
        notice ? APP_HEADER_NOTICE_OFFSET_CLASS : undefined,
        className,
      )}
    >
      {notice ? (
        <div
          className={cn(
            'shell-glass absolute inset-x-0 top-0 z-20 border-b border-warning/30 py-1 text-xs text-foreground shadow-sm',
            shellContentPaddingX,
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-warning/10" aria-hidden />
          <div className="relative">{notice}</div>
        </div>
      ) : null}
      <div className={cn('relative z-10 flex h-14 w-full items-center justify-between', shellContentPaddingX)}>
        <div className="flex min-w-0 items-center gap-2">
          {showMenuButton ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-md p-2 text-foreground outline-none ring-offset-background hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          ) : null}
          {logoNode}
        </div>
        {actions || trailingActions || onLocaleChange || user ? (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {onLocaleChange ? (
              <HeaderLocaleMenu
                locale={locale}
                onLocaleChange={onLocaleChange}
                labels={{
                  language: languageLabel,
                  english: englishLabel,
                  sinhala: sinhalaLabel,
                }}
              />
            ) : null}
            {trailingActions}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 overflow-hidden p-0"
                    aria-label="User menu"
                  >
                    <Avatar
                      size="sm"
                      className="h-full w-full rounded-md border-0"
                      src={user.avatarUrl}
                      alt={user.displayName}
                      fallback={getInitials(user.displayName)}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 overflow-x-hidden shadow-lg">
                  {onProfileClick ? (
                    <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer p-0">
                      <div className="flex w-full min-w-0 flex-col space-y-1.5 px-2 py-1.5">
                        <p className="break-words text-sm font-medium leading-snug">{user.displayName}</p>
                        {user.email ? (
                          <p className="break-all text-xs leading-snug text-muted-foreground">{user.email}</p>
                        ) : null}
                        <HeaderRoleTag role={user.role} roleLabel={user.roleLabel} />
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex min-w-0 flex-col space-y-1.5">
                        <p className="break-words text-sm font-medium leading-snug">{user.displayName}</p>
                        {user.email ? (
                          <p className="break-all text-xs leading-snug text-muted-foreground">{user.email}</p>
                        ) : null}
                        <HeaderRoleTag role={user.role} roleLabel={user.roleLabel} />
                      </div>
                    </DropdownMenuLabel>
                  )}
                  <DropdownMenuSeparator />
                  {menuItems}
                  {onProfileClick ? (
                    <DropdownMenuItem onClick={onProfileClick}>
                      <User />
                      {profileLabel}
                    </DropdownMenuItem>
                  ) : null}
                  {onLogout ? (
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut />
                      {logoutLabel}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}

export { AppHeader, HeaderLocaleMenu }
export type { AppHeaderProps, HeaderLocaleMenuProps }

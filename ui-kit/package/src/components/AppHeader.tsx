import type { ReactNode } from 'react'
import { Globe, LogOut, Menu, User, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Avatar } from './Avatar'
import { BrandLogo } from './BrandLogo'
import { isStatusTagVariant, StatusTag } from './StatusTag'
import { shellContentPaddingX } from '../layouts/shellContentPadding'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  onMenuClick?: () => void
  showMenuButton?: boolean
  menuOpen?: boolean
  /** Optional header actions (e.g. chat toggle), rendered before the user avatar. */
  actions?: ReactNode
  /** Full-width notice row below the main header bar (e.g. impersonation warning). */
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
  notice,
  className,
}: AppHeaderProps) {
  const logoNode = logo ?? <BrandLogo href={logoHref} />
  const languageLabel = labels?.language ?? 'Language'
  const englishLabel = labels?.english ?? 'English'
  const sinhalaLabel = labels?.sinhala ?? 'සිංහල'
  const profileLabel = labels?.profile ?? 'Profile'
  const logoutLabel = labels?.logout ?? 'Log out'

  return (
    <header className={cn('glass-card border-b', className)}>
      <div className={cn('flex h-14 w-full items-center justify-between', shellContentPaddingX)}>
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
        {actions || user ? (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="User menu"
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
                  {onProfileClick ? (
                    <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer p-0">
                      <div className="flex w-full flex-col space-y-1.5 px-2 py-1.5">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        {user.email ? (
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        ) : null}
                        <HeaderRoleTag role={user.role} roleLabel={user.roleLabel} />
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        {user.email ? (
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        ) : null}
                        <HeaderRoleTag role={user.role} roleLabel={user.roleLabel} />
                      </div>
                    </DropdownMenuLabel>
                  )}
                  <DropdownMenuSeparator />
                  {onLocaleChange ? (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Globe />
                        {languageLabel}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
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
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ) : null}
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
      {notice ? (
        <div
          className={cn(
            'border-t border-warning/30 bg-warning/10 text-sm font-medium text-foreground',
            shellContentPaddingX,
            'py-2',
          )}
        >
          {notice}
        </div>
      ) : null}
    </header>
  )
}

export { AppHeader }
export type { AppHeaderProps }

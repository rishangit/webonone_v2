import type { ReactNode } from 'react'
import { LogOut, Menu, User, X } from 'lucide-react'
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
  DropdownMenuTrigger,
} from './DropdownMenu'

export interface AppHeaderUser {
  displayName: string
  avatarUrl?: string | null
  email?: string
  /**
   * Platform role key (`super_admin` | `company_admin` | `member`) shown as a
   * StatusTag below email in the user dropdown.
   */
  role?: string
  /**
   * Plain-text fallback when `role` is omitted. Prefer `role` for StatusTag styling.
   * @deprecated Prefer `role`
   */
  roleLabel?: string
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
  onMenuClick?: () => void
  showMenuButton?: boolean
  menuOpen?: boolean
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
  onMenuClick,
  showMenuButton = false,
  menuOpen = false,
  className,
}: AppHeaderProps) {
  const logoNode = logo ?? <BrandLogo href={logoHref} />

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
              {onProfileClick ? (
                <DropdownMenuItem onClick={onProfileClick}>
                  <User />
                  Profile
                </DropdownMenuItem>
              ) : null}
              {onLogout ? (
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}

export { AppHeader }
export type { AppHeaderProps }

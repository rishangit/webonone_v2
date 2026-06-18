import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { cn } from '../lib/utils'
import { Avatar } from './Avatar'
import { BrandLogo } from './BrandLogo'
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
}

interface AppHeaderProps {
  logo?: ReactNode
  logoHref?: string
  user?: AppHeaderUser | null
  onLogout?: () => void
  className?: string
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

function AppHeader({ logo, logoHref, user, onLogout, className }: AppHeaderProps) {
  const logoNode = logo ?? <BrandLogo href={logoHref} />

  return (
    <header className={cn('border-b bg-background', className)}>
      <div className="flex h-14 w-full items-center justify-between px-4">
        <div className="flex min-w-0 items-center">{logoNode}</div>
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
            <DropdownMenuContent align="end" className="w-56 border-border bg-card shadow-lg">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  {user.email ? (
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
